<?php

namespace App\Http\Controllers\Attendance;

use App\Http\Controllers\Controller;
use App\Models\AttendanceRecord;
use App\Models\FormationSession;
use App\Models\UserInfo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ReportController extends Controller
{
    public function index()
    {
        $sessions = FormationSession::get();
        $totalSessionsCount = $sessions->count() ?: 19;

        $attendanceRecords = AttendanceRecord::all();
        $attendanceMap = [];

        foreach ($attendanceRecords as $record) {
            $status = strtolower($record->status ?? '');
            $uId = $record->user_id ?? $record->info_id ?? null;
            $sKey = $record->formation_session_id ?? $record->session_id ?? null;

            if (!$uId || !$sKey) continue;
            
            if ($status === 'present') {
                $val = 10;
            } elseif ($status === 'late') {
                $val = $record->points ?? 5;
            } elseif ($status === 'absent') {
                $val = 'A';
            } else {
                $val = '';
            }

            $attendanceMap[$uId][$sKey] = $val;
        }

        $cadets = UserInfo::with(['course', 'platoon'])
            ->orderBy('last_name', 'asc')
            ->orderBy('first_name', 'asc')
            ->get();

        $cadetAttendanceList = $cadets->map(function ($cadet, $index) use ($sessions, $attendanceMap) {
            $userKey = $cadet->user_id ?? $cadet->info_id;
            $cadetLogs = $attendanceMap[$userKey] ?? [];

            $sessionMatrix = [];
            $totalPoints = 0;
            $latesCount = 0;
            $absencesCount = 0;
            $attendedCount = 0;

            foreach ($sessions as $sIndex => $session) {
                $sId = $session->session_id ?? $session->id ?? ($sIndex + 1);
                $val = $cadetLogs[$sId] ?? '';

                if ($val === 10) {
                    $totalPoints += 10;
                    $attendedCount++;
                } elseif (is_numeric($val) && $val > 0) {
                    $totalPoints += (int)$val;
                    $attendedCount++;
                    if ($val < 10) {
                        $latesCount++;
                    }
                } elseif ($val === 'A') {
                    $absencesCount++;
                }

                $sessionMatrix[$sId] = $val;
            }

            $firstName = $cadet->first_name ?? '';
            $lastName  = $cadet->last_name ?? '';
            $fullName  = trim("{$lastName}, {$firstName}");

            $studentId = $cadet->student_id_number 
                ?? $cadet->serial_number 
                ?? ($cadet->email ? explode('@', $cadet->email)[0] : 'N/A');

            return [
                'nr'                => $index + 1,
                'id'                => $userKey,
                'user_id'           => $userKey,
                'name'              => $fullName ?: 'Unknown Cadet',
                'student_id'        => $studentId,
                'program'           => $cadet->course?->course_name ?? 'N/A',
                'platoon'           => $cadet->platoon?->platoon_name ?? 'N/A',
                'matrix'            => $sessionMatrix,
                'attendance_points' => $totalPoints,
                'lates'             => $latesCount,
                'absences'          => $absencesCount,
                'attended'          => $attendedCount,
                'status'            => strtolower($cadet->status ?? 'active'),
                'remarks'           => $absencesCount >= 3 ? '3+ ABSENCES (DROPPED RISK)' : 'GOOD STANDING',
            ];
        });

        $criticalAbsencesCount  = $cadetAttendanceList->filter(fn($c) => $c['absences'] >= 3)->count();
        $totalActiveCadetsCount = $cadets->where('status', 'active')->count();

        $averageAttendanceRate = $cadetAttendanceList->count() > 0 
            ? round(($cadetAttendanceList->sum('attended') / ($cadetAttendanceList->count() * max(1, $totalSessionsCount))) * 100, 1) 
            : 0;

        return Inertia::render('Reports', [
            'metrics' => [
                'averageAttendance'     => $averageAttendanceRate,
                'totalEvents'           => $totalSessionsCount,
                'activeCadets'          => $totalActiveCadetsCount,
                'totalEnrolled'         => $cadets->count(),
                'criticalAbsencesCount' => $criticalAbsencesCount,
            ],
            'sessions'            => $sessions,
            'cadetAttendanceList' => $cadetAttendanceList->values()->toArray(),
        ]);
    }

    /**
     * Export color-coded Excel spreadsheet natively using HTML table wrapper (.xls format).
     */
    public function exportExcel()
    {
        $sessions = FormationSession::orderBy('session_id', 'asc')->get();
        if ($sessions->isEmpty()) {
            $sessions = FormationSession::get();
        }

        $cadets = UserInfo::orderBy('last_name', 'asc')->orderBy('first_name', 'asc')->get();

        // Fetch attendance records and index by user_id and session identifier
        $attendanceRecords = AttendanceRecord::all();
        $attendanceMap = [];
        
        foreach ($attendanceRecords as $record) {
            $status = strtolower($record->status ?? '');
            $uId = $record->user_id ?? $record->info_id ?? null;
            $sKey = $record->formation_session_id ?? $record->session_id ?? $record->id ?? null;

            if (!$uId || !$sKey) continue;

            if ($status === 'present') {
                $val = 10;
            } elseif ($status === 'late') {
                $val = $record->points ?? 5;
            } else {
                $val = ''; // Leave blank if unrecorded
            }

            $attendanceMap[$uId][$sKey] = $val;
        }

        $filename = 'USeP_ROTC_ATTENDANCE_SHEET_' . date('Y-m-d') . '.xls';

        $headers = [
            'Content-Type'        => 'application/vnd.ms-excel; charset=utf-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        return response()->stream(function () use ($sessions, $cadets, $attendanceMap) {
            echo '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
            echo '<head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><style>';
            echo 'table { border-collapse: collapse; font-family: Calibri, sans-serif; font-size: 11pt; }';
            echo 'th, td { border: 0.5pt solid #000000; text-align: center; vertical-align: middle; padding: 4px; }';
            echo '.banner { background-color: #84CAEB; font-weight: bold; }';
            echo '.subhead { background-color: #E7E773; font-weight: bold; }';
            echo '.tablehead { background-color: #FFFFCC; font-weight: bold; }';
            echo '.present { background-color: #92D050; font-weight: bold; }';
            echo '.late { background-color: #FFFF00; font-weight: bold; }';
            echo '.totalcol { background-color: #FCE4D6; font-weight: bold; }';
            echo '</style></head><body>';
            echo '<table>';

            // Row 1: Header Banner
            echo '<tr>';
            echo '<th colspan="2" class="banner">USeP TAGUM UNIT</th>';
            echo '<th colspan="19" class="banner">LE 1: ATTENDANCE (30%)</th>';
            echo '<th rowspan="2" class="subhead">TOTAL</th>';
            echo '</tr>';

            // Row 2: Subheader (Session Numbers 1..15, F1..F4)
            echo '<tr>';
            echo '<th colspan="2" class="subhead">MALE &amp; FEMALE</th>';
            $sessionLabels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 'F1', 'F2', 'F3', 'F4'];
            foreach ($sessionLabels as $lbl) {
                echo '<th class="subhead">' . $lbl . '</th>';
            }
            echo '</tr>';

            // Row 3: Table Headers & Dates (Cols C-Q dates, Cols R-U point caps 10, Col V Total 190)
            echo '<tr class="tablehead">';
            echo '<th>Nr.</th>';
            echo '<th style="text-align: left; min-width: 220px;">SURNAME, Given Name, MI</th>';
            
            // Columns C to Q (Sessions 1 to 15)
            for ($i = 0; $i < 15; $i++) {
                $session = $sessions[$i] ?? null;
                $dateStr = '';
                if ($session) {
                    $rawDate = $session->session_date ?? $session->date ?? $session->created_at ?? null;
                    $dateStr = $rawDate ? date('m/d/y', strtotime($rawDate)) : '';
                }
                echo '<th>' . $dateStr . '</th>';
            }

            // Columns R to U (F1 to F4 point caps = 10)
            for ($i = 0; $i < 4; $i++) {
                echo '<th>10</th>';
            }

            // Column V (Total Max = 190)
            echo '<th>190</th>';
            echo '</tr>';

            // Cadet Data Rows
            foreach ($cadets as $idx => $cadet) {
                $rowNum = $idx + 4;
                $userKey = $cadet->user_id ?? $cadet->info_id;
                $fullName = trim("{$cadet->last_name}, {$cadet->first_name}");

                echo '<tr>';
                echo '<td>' . ($idx + 1) . '</td>';
                echo '<td style="text-align: left;">' . htmlspecialchars($fullName) . '</td>';

                for ($sIdx = 0; $sIdx < 19; $sIdx++) {
                    $session = $sessions[$sIdx] ?? null;
                    if (!$session) {
                        echo '<td></td>';
                        continue;
                    }

                    $sId = $session->session_id ?? $session->id ?? ($sIdx + 1);
                    $val = $attendanceMap[$userKey][$sId] ?? ($attendanceMap[$userKey][$sIdx + 1] ?? '');

                    $class = '';
                    if ($val === 10) {
                        $class = 'present';
                    } elseif ($val !== '' && is_numeric($val) && $val < 10) {
                        $class = 'late';
                    }

                    echo '<td class="' . $class . '">' . $val . '</td>';
                }

                // Total column formula matching original Excel (=SUM(C4:U4))
                echo '<td class="totalcol">=SUM(C' . $rowNum . ':U' . $rowNum . ')</td>';
                echo '</tr>';
            }

            echo '</table></body></html>';
        }, 200, $headers);
    }
}