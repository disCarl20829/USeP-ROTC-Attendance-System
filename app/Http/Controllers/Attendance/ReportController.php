<?php

namespace App\Http\Controllers\Attendance;

use App\Http\Controllers\Controller;
use App\Support\Attendance;
use App\Support\AttendanceReport;
use App\Support\AttendanceSheet;
use Carbon\Carbon;
use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

/**
 * LE 1: Attendance points matrix and its Excel export.
 * Points per status come from config/rotc.php (present 10, late 5, excused 8, absent 0).
 */
class ReportController extends Controller
{
    public function index()
    {
        ['sessions' => $sessions, 'rows' => $rows] = AttendanceReport::build();
        $ended   = $sessions->where('ended', true)->count();
        $columns = AttendanceReport::columnCount($sessions);

        return Inertia::render('Reports', [
            'metrics' => [
                'averageAttendance'     => $rows->count() && $ended
                    ? round($rows->avg(fn ($r) => $r['attended'] / max(1, $r['recorded'])) * 100, 1)
                    : 0,
                'totalEvents'           => $sessions->count(),
                'activeCadets'          => $rows->where('status', 'active')->count(),
                'totalEnrolled'         => $rows->count(),
                'criticalAbsencesCount' => $rows->filter(fn ($r) => $r['absences'] >= 3 && $r['status'] === 'active')->count(),
                'maxPoints'             => Attendance::maxPoints($columns),
                'columns'               => $columns,
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

    /** Real .xlsx: "All" sheet + one sheet per platoon. */
    public function exportExcel()
    {
        $book     = AttendanceSheet::build();
        $filename = 'USeP_ROTC_LE1_Attendance_' . Carbon::now(config('rotc.timezone'))->format('Y-m-d') . '.xlsx';

        return response()->streamDownload(function () use ($book) {
            (new Xlsx($book))->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }
}
