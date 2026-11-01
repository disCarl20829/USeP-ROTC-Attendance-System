<?php

namespace App\Http\Controllers\Attendance;

use App\Http\Controllers\Controller;
use App\Models\AttendanceRecord;
use App\Models\FormationSession;
use App\Models\UserInfo;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ReportController extends Controller
{
    public function index()
    {
        // 1. Core Metrics & Counts
        $totalSessionsCount = FormationSession::count();
        $totalEnrolledCount = UserInfo::count();
        $totalRecordsCount  = AttendanceRecord::count();

        $totalActiveCadetsCount = UserInfo::where(function ($query) {
            $query->whereNull('status')
                  ->orWhereRaw("LOWER(status) = 'active'");
        })->count();

        // 2. Average Attendance Percentage
        $totalPossibleAttendance = $totalEnrolledCount * $totalSessionsCount;
        $presentOrLateCount      = AttendanceRecord::whereIn(DB::raw('LOWER(status)'), ['present', 'late'])->count();

        $averageAttendanceRate = $totalPossibleAttendance > 0 
            ? round(($presentOrLateCount / $totalPossibleAttendance) * 100, 1)
            : ($totalRecordsCount > 0 ? round(($presentOrLateCount / $totalRecordsCount) * 100, 1) : 0);

        // 3. Monthly Attendance Trend (Last 9 Months)
        $months = [];
        for ($i = 8; $i >= 0; $i--) {
            $monthDate = now()->subMonths($i);
            $monthKey  = $monthDate->format('Y-m');
            $monthName = $monthDate->format('M');

            $monthRecords = AttendanceRecord::whereRaw("TO_CHAR(time_in, 'YYYY-MM') = ?", [$monthKey])->get();
            $monthTotal   = $monthRecords->count();
            $monthPresent = $monthRecords->whereIn('status', ['present', 'late'])->count();

            $rate = $monthTotal > 0 ? round(($monthPresent / $monthTotal) * 100) : 0;

            $months[] = [
                'month'      => $monthName,
                'attendance' => $rate,
            ];
        }

        // 4. Aggregated Cadet Attendance Statistics (Single GROUP BY Query)
        $attendanceStats = AttendanceRecord::select(
            'user_id',
            DB::raw("COUNT(CASE WHEN LOWER(status) = 'late' THEN 1 END) as lates_count"),
            DB::raw("COUNT(CASE WHEN LOWER(status) = 'absent' THEN 1 END) as absences_count"),
            DB::raw("COUNT(CASE WHEN LOWER(status) IN ('present', 'late') THEN 1 END) as attended_count")
        )
        ->groupBy('user_id')
        ->get()
        ->keyBy('user_id');

        // 5. Map Cadet Records for Reports Table & Lazy Loading
        $cadets = UserInfo::with(['course', 'platoon'])
            ->orderBy('last_name', 'asc')
            ->orderBy('first_name', 'asc')
            ->get();

        $cadetAttendanceList = $cadets->map(function ($cadet) use ($attendanceStats, $totalSessionsCount) {
            $userKey = $cadet->user_id ?? $cadet->info_id;
            $stat    = $attendanceStats->get($userKey);

            $lates            = $stat ? (int) $stat->lates_count : 0;
            $explicitAbsences = $stat ? (int) $stat->absences_count : 0;
            $attended         = $stat ? (int) $stat->attended_count : 0;

            // Fallback to missing sessions count if explicit absent status isn't recorded
            $absences = $explicitAbsences > 0 
                ? $explicitAbsences 
                : max(0, $totalSessionsCount - $attended);

            $firstName = $cadet->first_name ?? '';
            $lastName  = $cadet->last_name ?? '';
            $fullName  = trim("{$lastName}, {$firstName}");

            $idNumber = $cadet->student_id_number 
                ?? $cadet->serial_number 
                ?? ($cadet->email ? explode('@', $cadet->email)[0] : 'N/A');

            return [
                'id'         => $userKey,
                'user_id'    => $userKey,
                'name'       => $fullName ?: 'Unknown Cadet',
                'student_id' => $idNumber,
                'course'     => $cadet->course?->course_name ?? 'N/A',
                'platoon'    => $cadet->platoon?->platoon_name ?? 'N/A',
                'lates'      => $lates,
                'absences'   => $absences,
                'attended'   => $attended,
                'status'     => strtolower($cadet->status ?? 'active'),
            ];
        });

        // 6. Calculate 3+ Absences Warning Metric
        $criticalAbsencesCount = $cadetAttendanceList->filter(fn($c) => $c['absences'] >= 3)->count();

        return Inertia::render('Reports', [
            'metrics' => [
                'averageAttendance'     => $averageAttendanceRate,
                'totalEvents'           => $totalSessionsCount,
                'activeCadets'          => $totalActiveCadetsCount,
                'totalEnrolled'         => $totalEnrolledCount,
                'criticalAbsencesCount' => $criticalAbsencesCount,
            ],
            'monthlyData'         => $months,
            'cadetAttendanceList' => $cadetAttendanceList->values()->toArray(),
        ]);
    }
}