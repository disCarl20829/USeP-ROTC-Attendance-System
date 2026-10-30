<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\AttendanceRecord;
use App\Models\FormationEvent;
use App\Models\UserInfo;
use Carbon\Carbon;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $today = now()->toDateString();

        // 1. Calculate Stats
        $totalCadets = UserInfo::count();
        $activeEvents = FormationEvent::where('formation_date', '>=', $today)->count();
        
        $todayTotalRecords = AttendanceRecord::whereDate('date_added', $today)->count();
        $presentTodayCount = AttendanceRecord::whereIn('status', ['present', 'late'])
            ->whereDate('date_added', $today)
            ->count();

        $attendanceRate = $todayTotalRecords > 0 
            ? round(($presentTodayCount / $todayTotalRecords) * 100, 1) . '%' 
            : '0%';

        $absentToday = AttendanceRecord::where('status', 'absent')
            ->whereDate('date_added', $today)
            ->count();

        // 2. Fetch Recent Activity (Today's Latest Attendance Records)
        $recentActivity = AttendanceRecord::with(['user', 'event'])
            ->whereDate('date_added', $today)
            ->latest('date_added')
            ->take(6)
            ->get()
            ->map(function ($record) {
                return [
                    'id' => $record->id,
                    'cadet' => $record->user ? ($record->user->first_name . ' ' . $record->user->last_name) : 'Unknown Cadet',
                    'event' => $record->event ? $record->event->event_name : 'Formation',
                    'status' => strtolower($record->status),
                    'time' => $record->date_added ? Carbon::parse($record->date_added)->format('h:i A') : '-',
                ];
            });

        // 3. Fetch Upcoming Events
        $upcomingEvents = FormationEvent::where('formation_date', '>=', $today)
            ->orderBy('formation_date', 'asc')
            ->take(3)
            ->get()
            ->map(function ($event) {
                return [
                    'id' => $event->id,
                    'name' => $event->event_name,
                    'date' => Carbon::parse($event->formation_date)->format('M d, Y'),
                    'time' => $event->start_time ? Carbon::parse($event->start_time)->format('h:i A') : 'TBA',
                    'location' => $event->location ?? 'Campus Grounds',
                ];
            });

        return Inertia::render('Dashboard', [
            'statsData' => [
                'totalCadets' => $totalCadets,
                'activeEvents' => $activeEvents,
                'attendanceRate' => $attendanceRate,
                'absentToday' => $absentToday,
            ],
            'recentActivity' => $recentActivity,
            'upcomingEvents' => $upcomingEvents,
        ]);
    }
}