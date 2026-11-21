<?php

namespace App\Http\Controllers\Attendance;

use App\Http\Controllers\Controller;
use App\Models\AttendanceRecord;
use App\Support\Attendance;
use App\Support\Permissions;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Inertia\Inertia;

/**
 * LE 1: Attendance points matrix.
 * Points per status come from config/rotc.php (present 10, late 5, excused 8, absent 0).
 * Absent cells show "A" (0 points); sessions without a record yet are blank.
 */
class ReportController extends Controller
{
    public function index()
    {
        [$sessions, $rows] = $this->build();
        $ended = $sessions->where('ended', true)->count();

        return Inertia::render('Reports', [
            'metrics' => [
                'averageAttendance'     => $rows->count() && $ended
                    ? round($rows->avg(fn ($r) => $r['attended'] / max(1, $r['recorded'])) * 100, 1)
                    : 0,
                'totalEvents'           => $sessions->count(),
                'activeCadets'          => $rows->where('status', 'active')->count(),
                'totalEnrolled'         => $rows->count(),
                'criticalAbsencesCount' => $rows->filter(fn ($r) => $r['absences'] >= 3)->count(),
                'maxPoints'             => Attendance::maxPoints($sessions->count()),
            ],
            'points'              => config('rotc.points'),
            'sessions'            => $sessions->map(fn ($s, $i) => [
                'id'           => $s['session_id'],
                'session_id'   => $s['session_id'],
                'number'       => $i + 1,
                'session_date' => $s['date'],
                'title'        => $s['label'],
            ])->values(),
            'cadetAttendanceList' => $rows->values(),
        ]);
    }

    /** @return array{0: Collection, 1: Collection} */
    private function build(): array
    {
        $sessions = Attendance::sessions()->values();
        $cadets   = Attendance::cadetsQuery(includeDropped: true)->get();
        $records  = AttendanceRecord::whereIn('user_id', $cadets->pluck('user_id'))->get()
            ->groupBy('user_id')
            ->map(fn ($rs) => $rs->keyBy('session_id'));

        $rows = $cadets->values()->map(function ($cadet, $i) use ($sessions, $records) {
            $mine   = $records->get($cadet->user_id, collect());
            $matrix = [];
            $tally  = ['present' => 0, 'late' => 0, 'excused' => 0, 'absent' => 0];
            $total  = 0;

            foreach ($sessions as $s) {
                $status = strtolower((string) $mine->get($s['session_id'])?->status);

                if (isset($tally[$status])) {
                    $tally[$status]++;
                    $total += Permissions::points($status);
                    $matrix[$s['session_id']] = $status === 'absent' ? 'A' : Permissions::points($status);
                } else {
                    $matrix[$s['session_id']] = '';
                }
            }

            $recorded = array_sum($tally);

            return [
                'nr'                => $i + 1,
                'id'                => $cadet->user_id,
                'user_id'           => $cadet->user_id,
                'name'              => trim("{$cadet->last_name}, {$cadet->first_name}"),
                'student_id'        => (string) $cadet->student_id,
                'program'           => $cadet->course?->course_name ?? 'N/A',
                'platoon'           => $cadet->platoon?->platoon_name ?? 'Unspecified',
                'matrix'            => $matrix,
                'attendance_points' => $total,
                'lates'             => $tally['late'],
                'excused'           => $tally['excused'],
                'absences'          => $tally['absent'],
                'attended'          => $tally['present'] + $tally['late'] + $tally['excused'],
                'recorded'          => $recorded,
                'status'            => strtolower((string) $cadet->status),
                'remarks'           => strtolower((string) $cadet->status) === 'dropped'
                    ? 'DROPPED'
                    : ($tally['absent'] >= 3 ? '3+ ABSENCES (DROP RISK)' : 'GOOD STANDING'),
            ];
        });

        return [$sessions, $rows];
    }

    /** Color-coded Excel sheet (HTML table saved as .xls; opens in Excel and Google Sheets). */
    public function exportExcel()
    {
        [$sessions, $rows] = $this->build();
        $points   = config('rotc.points');
        $count    = $sessions->count();
        $max      = Attendance::maxPoints($count);
        $filename = 'USeP_ROTC_ATTENDANCE_SHEET_' . Carbon::now(config('rotc.timezone'))->format('Y-m-d') . '.xls';
        $e        = fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES, 'UTF-8');

        // Spreadsheet column letter for a 1-based index.
        $col = function (int $n): string {
            $s = '';
            while ($n > 0) {
                $m = ($n - 1) % 26;
                $s = chr(65 + $m) . $s;
                $n = intdiv($n - 1, 26);
            }

            return $s;
        };

        return response()->stream(function () use ($sessions, $rows, $points, $count, $max, $e, $col) {
            echo '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
            echo '<head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><style>';
            echo 'table{border-collapse:collapse;font-family:Calibri,sans-serif;font-size:11pt}';
            echo 'th,td{border:0.5pt solid #000;text-align:center;vertical-align:middle;padding:4px}';
            echo '.banner{background:#84CAEB;font-weight:bold}.subhead{background:#E7E773;font-weight:bold}';
            echo '.tablehead{background:#FFFFCC;font-weight:bold}.present{background:#92D050;font-weight:bold}';
            echo '.late{background:#FFFF00;font-weight:bold}.excused{background:#9BC2E6;font-weight:bold}';
            echo '.absent{background:#FF7C80;font-weight:bold}.dropped{color:#808080}.totalcol{background:#FCE4D6;font-weight:bold}';
            echo '</style></head><body><table>';

            $span = max(1, $count);

            echo '<tr><th colspan="3" class="banner">USeP TAGUM UNIT</th>';
            echo '<th colspan="' . $span . '" class="banner">LE 1: ATTENDANCE (30%)</th>';
            echo '<th rowspan="2" class="subhead">TOTAL</th><th rowspan="3" class="subhead">REMARKS</th></tr>';

            echo '<tr><th colspan="3" class="subhead">MALE &amp; FEMALE</th>';
            if ($count === 0) {
                echo '<th class="subhead">No sessions yet</th>';
            }
            foreach ($sessions as $i => $s) {
                echo '<th class="subhead">' . ($i + 1) . '</th>';
            }
            echo '</tr>';

            echo '<tr class="tablehead"><th>Nr.</th><th style="text-align:left;min-width:220px">SURNAME, Given Name</th><th>Student ID</th>';
            if ($count === 0) {
                echo '<th></th>';
            }
            foreach ($sessions as $s) {
                echo '<th>' . $e($s['date'] ? Carbon::parse($s['date'])->format('m/d/y') : '') . '<br>' . $e(ucfirst((string) $s['type'])) . '</th>';
            }
            echo '<th>' . $max . '</th></tr>';

            $firstCol = $col(4);
            $lastCol  = $col(3 + max(1, $count));

            foreach ($rows as $idx => $r) {
                $rowNum  = $idx + 4;
                $dropped = $r['status'] === 'dropped';

                echo '<tr' . ($dropped ? ' class="dropped"' : '') . '>';
                echo '<td>' . ($idx + 1) . '</td>';
                echo '<td style="text-align:left">' . $e($r['name']) . '</td>';
                echo '<td style="mso-number-format:\'\@\'">' . $e($r['student_id']) . '</td>';

                if ($count === 0) {
                    echo '<td></td>';
                }

                foreach ($sessions as $s) {
                    $val   = $r['matrix'][$s['session_id']] ?? '';
                    $class = match (true) {
                        $val === 'A'               => 'absent',
                        $val === $points['present'] => 'present',
                        $val === $points['excused'] => 'excused',
                        $val === $points['late']    => 'late',
                        default                     => '',
                    };
                    // "A" counts as 0 in the SUM formula (text is ignored).
                    echo '<td class="' . $class . '">' . $e($val) . '</td>';
                }

                echo '<td class="totalcol">=SUM(' . $firstCol . $rowNum . ':' . $lastCol . $rowNum . ')</td>';
                echo '<td>' . $e($r['remarks']) . '</td>';
                echo '</tr>';
            }

            // Legend
            $legendSpan = 3 + max(1, $count) + 2;
            echo '<tr><td colspan="' . $legendSpan . '" style="border:none"></td></tr>';
            echo '<tr><td colspan="3" class="present">Present = ' . $points['present'] . '</td>'
                . '<td colspan="2" class="late">Late = ' . $points['late'] . '</td>'
                . '<td colspan="2" class="excused">Excused = ' . $points['excused'] . '</td>'
                . '<td colspan="2" class="absent">Absent (A) = ' . $points['absent'] . '</td></tr>';

            echo '</table></body></html>';
        }, 200, [
            'Content-Type'        => 'application/vnd.ms-excel; charset=utf-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }
}
