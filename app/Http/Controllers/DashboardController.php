<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\AttendanceRecord;
use App\Models\FormationEvent;
use App\Models\FormationSession;
use App\Models\UserInfo;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $today = now()->toDateString();

        // 1. Fetch Authenticated Supabase User Profile & QR Code Data
        $userId = $request->session()->get('supabase_user_id');
        $email  = (string) $request->session()->get('supabase_email', '');

        $userProfile = null;
        if ($userId || $email) {
            $userProfile = UserInfo::with(['course', 'platoon', 'role'])
                ->where(function ($query) use ($userId, $email) {
                    if ($userId) {
                        $query->where('user_id', $userId);
                    }
                    if ($email) {
                        $query->orWhere('email', $email);
                    }
                })
                ->first();
        }

        // Resolve Cadet ID for QR Code Generation
        $studentId = $userProfile?->student_id_number 
            ?? $userProfile?->serial_number 
            ?? ($email !== '' ? explode('@', $email)[0] : 'CADET-0000');

        $firstName = $userProfile?->first_name ?? ($email !== '' ? explode('@', $email)[0] : 'Cadet');
        $lastName  = $userProfile?->last_name ?? '';
        $fullName  = trim("{$firstName} {$lastName}") ?: 'Cadet';

        $cadetData = [
            'name'        => $fullName,
            'student_id'  => $studentId,
            'email'       => $email,
            'course'      => $userProfile?->course?->course_name ?? 'ROTC Cadet',
            'platoon'     => $userProfile?->platoon?->platoon_name ?? 'N/A',
            'qrCodeValue' => $studentId,
        ];

        // 2. Total Active Cadets Count
        $totalCadets = UserInfo::where(function ($query) {
            $query->whereNull('status')
                  ->orWhereRaw("LOWER(status) = 'active'");
        })->count();

        // 3. Active / Upcoming Events Count
        $activeEvents = class_exists(FormationEvent::class) 
            ? FormationEvent::where(function ($q) use ($today) {
                if (DB::getSchemaBuilder()->hasColumn('formation_events', 'formation_date')) {
                    $q->where('formation_date', '>=', $today);
                } elseif (DB::getSchemaBuilder()->hasColumn('formation_events', 'event_date')) {
                    $q->where('event_date', '>=', $today);
                }
            })->count()
            : (class_exists(FormationSession::class) ? FormationSession::count() : 0);

        // 4. Today's Attendance Calculations
        $dateColumn = DB::raw("COALESCE(date_added, time_in)");

        $todayTotalRecords = AttendanceRecord::whereDate($dateColumn, $today)->count();

        $presentTodayCount = AttendanceRecord::whereIn(DB::raw('LOWER(status)'), ['present', 'late'])
            ->whereDate($dateColumn, $today)
            ->count();

        $absentToday = AttendanceRecord::where(DB::raw('LOWER(status)'), 'absent')
            ->whereDate($dateColumn, $today)
            ->count();

        $attendanceRate = $todayTotalRecords > 0 
            ? round(($presentTodayCount / $todayTotalRecords) * 100, 1) . '%' 
            : ($totalCadets > 0 ? round(($presentTodayCount / $totalCadets) * 100, 1) . '%' : '0%');

        // 5. Fetch Recent Activity (Latest Attendance Logged Today)
        $recentActivityQuery = AttendanceRecord::query();

        if (method_exists(AttendanceRecord::class, 'user')) {
            $recentActivityQuery->with('user');
        }
        if (method_exists(AttendanceRecord::class, 'session')) {
            $recentActivityQuery->with('session');
        } elseif (method_exists(AttendanceRecord::class, 'event')) {
            $recentActivityQuery->with('event');
        }

        $recentActivity = $recentActivityQuery
            ->whereDate($dateColumn, $today)
            ->orderBy($dateColumn, 'desc')
            ->take(6)
            ->get()
            ->map(function ($record) {
                $cadetName = 'Unknown Cadet';
                if ($record->user) {
                    $firstName = $record->user->first_name ?? '';
                    $lastName  = $record->user->last_name ?? '';
                    $cadetName = trim("{$firstName} {$lastName}") ?: 'Unknown Cadet';
                }

                $eventName = $record->session?->session_name 
                    ?? $record->event?->event_name 
                    ?? 'Formation Drill';

                $recordTimestamp = $record->date_added ?? $record->time_in;

                return [
                    'id'     => $record->record_id ?? $record->id,
                    'cadet'  => $cadetName,
                    'event'  => $eventName,
                    'status' => strtolower($record->status ?? 'present'),
                    'time'   => $recordTimestamp ? Carbon::parse($recordTimestamp)->format('h:i A') : '-',
                ];
            });

        // 6. Fetch Upcoming Events
        $upcomingEvents = [];
        if (class_exists(FormationEvent::class)) {
            $dateField = DB::getSchemaBuilder()->hasColumn('formation_events', 'formation_date') 
                ? 'formation_date' 
                : (DB::getSchemaBuilder()->hasColumn('formation_events', 'event_date') ? 'event_date' : null);

            if ($dateField) {
                $upcomingEvents = FormationEvent::where($dateField, '>=', $today)
                    ->orderBy($dateField, 'asc')
                    ->take(3)
                    ->get()
                    ->map(function ($event) use ($dateField) {
                        $eventDate = $event->$dateField;
                        return [
                            'id'       => $event->id ?? $event->event_id,
                            'name'     => $event->event_name ?? $event->name ?? 'ROTC Formation',
                            'date'     => $eventDate ? Carbon::parse($eventDate)->format('M d, Y') : 'TBA',
                            'time'     => $event->start_time ? Carbon::parse($event->start_time)->format('h:i A') : '07:00 AM',
                            'location' => $event->location ?? 'Campus Grandstand',
                        ];
                    });
            }
        }

        return Inertia::render('Dashboard', [
            'cadet'     => $cadetData,
            'statsData' => [
                'totalCadets'    => $totalCadets,
                'activeEvents'   => $activeEvents,
                'attendanceRate' => $attendanceRate,
                'absentToday'    => $absentToday,
            ],
            'recentActivity' => $recentActivity->values()->toArray(),
            'upcomingEvents' => $upcomingEvents,
        ]);
    }
}