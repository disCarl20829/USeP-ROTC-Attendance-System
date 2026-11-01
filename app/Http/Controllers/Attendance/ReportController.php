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
        // 1. Core Counts
        $totalSessionsCount = FormationSession::count();
        $totalActiveCadetsCount = UserInfo::count();
        $totalRecordsCount = AttendanceRecord::count();

        // 2. Average Attendance Percentage
        $totalPossibleAttendance = $totalActiveCadetsCount * $totalSessionsCount;
        $presentOrLateCount = AttendanceRecord::whereIn('status', ['present', 'late'])->count();

        $averageAttendanceRate = $totalPossibleAttendance > 0 
            ? round(($presentOrLateCount / $totalPossibleAttendance) * 100, 1)
            : ($totalRecordsCount > 0 ? round(($presentOrLateCount / $totalRecordsCount) * 100, 1) : 0);

        // 3. Monthly Attendance Trend (Last 9 months)
        $months = [];
        for ($i = 8; $i >= 0; $i--) {
            $monthDate = now()->subMonths($i);
            $monthKey = $monthDate->format('Y-m');
            $monthName = $monthDate->format('M');

            $monthRecords = AttendanceRecord::whereRaw("TO_CHAR(time_in, 'YYYY-MM') = ?", [$monthKey])->get();
            $monthTotal = $monthRecords->count();
            $monthPresent = $monthRecords->whereIn('status', ['present', 'late'])->count();

            $rate = $monthTotal > 0 ? round(($monthPresent / $monthTotal) * 100) : 0;

            $months[] = [
                'month' => $monthName,
                'attendance' => $rate,
            ];
        }

        // 4. Top Cadets by Attendance Rate
        $cadets = UserInfo::all();
        $topCadets = $cadets->map(function ($cadet) use ($totalSessionsCount) {
            $attendedCount = AttendanceRecord::where('user_id', $cadet->user_id)
                ->whereIn('status', ['present', 'late'])
                ->count();

            $rate = $totalSessionsCount > 0 
                ? round(($attendedCount / $totalSessionsCount) * 100) 
                : 0;

            $fullName = trim(($cadet->first_name ?? '') . ' ' . ($cadet->last_name ?? ''));

            return [
                'id' => $cadet->user_id,
                'name' => $fullName ?: 'Unknown Cadet',
                'attendance' => $rate,
                'events' => $attendedCount,
            ];
        })
        ->sortByDesc('attendance')
        ->take(5)
        ->values();

        return Inertia::render('Reports', [
            'metrics' => [
                'averageAttendance' => $averageAttendanceRate,
                'totalEvents'       => $totalSessionsCount,
                'activeCadets'      => $totalActiveCadetsCount,
            ],
            'monthlyData' => $months,
            'topCadets'   => $topCadets,
        ]);
    }
}