<?php

namespace App\Http\Controllers;

use App\Models\AttendanceRecord;
use App\Models\FormationEvent;
use App\Models\UserInfo;
use App\Support\Attendance;
use App\Support\CurrentProfile;
use App\Support\Permissions;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $profile = CurrentProfile::get($request);
        $tz      = config('rotc.timezone');
        $today   = Carbon::now($tz)->toDateString();

        $canOverview = Permissions::allows($profile, 'attendance.view') || Permissions::allows($profile, 'reports.view');

        return Inertia::render('Dashboard', [
            'profile'        => [...$profile->toProfileArray(), 'qr_token' => $profile->ensureQrToken()],
            'myAttendance'   => self::attendanceSummary($profile),
            'overview'       => $canOverview ? $this->overview($today, $tz) : null,
            'upcomingEvents' => self::upcomingEvents($today),
            'points'         => config('rotc.points'),
        ]);
    }

    /** Personal attendance: counts, points and history (newest first). */
    public static function attendanceSummary(UserInfo $profile): array
    {
        $tz       = config('rotc.timezone');
        $sessions = Attendance::sessions()->keyBy('session_id');
        $records  = AttendanceRecord::where('user_id', $profile->user_id)->get()->keyBy('session_id');

        $counts  = ['present' => 0, 'late' => 0, 'excused' => 0, 'absent' => 0];
        $history = [];
        $points  = 0;
        $counted = 0;

        foreach ($sessions->reverse() as $id => $session) {
            $record = $records->get($id);
            $status = $record ? strtolower((string) $record->status) : null;

            if ($status && isset($counts[$status])) {
                $counts[$status]++;
                $points += Permissions::points($status);
                $counted++;
            }

            if ($record || $session['ended']) {
                $history[] = [
                    'session_id' => $id,
                    'label'      => $session['label'],
                    'status'     => $status ?? 'pending',
                    'points'     => $status ? Permissions::points($status) : null,
                    'time_in'    => $record?->time_in ? Carbon::parse($record->time_in)->setTimezone($tz)->format('h:i A') : null,
                    'time_out'   => $record?->time_out ? Carbon::parse($record->time_out)->setTimezone($tz)->format('h:i A') : null,
                ];
            }
        }

        $max = Attendance::maxPoints($counted);

        return [
            'counts'     => $counts,
            'points'     => $points,
            'max_points' => $max,
            'rate'       => $counted > 0 ? round((($counts['present'] + $counts['late'] + $counts['excused']) / $counted) * 100, 1) : null,
            'history'    => array_slice($history, 0, 10),
        ];
    }

    private function overview(string $today, string $tz): array
    {
        $todaySessionIds = Attendance::sessions()->where('date', $today)->pluck('session_id');
        $todayRecords    = AttendanceRecord::whereIn('session_id', $todaySessionIds)->get();

        $recent = AttendanceRecord::with(['user', 'session.formation'])
            ->whereNotNull('time_in')
            ->orderByDesc('time_in')
            ->limit(6)
            ->get()
            ->map(fn ($r) => [
                'id'     => $r->record_id,
                'cadet'  => $r->user?->full_name ?? 'Cadet',
                'event'  => ucfirst((string) $r->session?->session_type) . ' — ' . ($r->session?->formation?->formation_name ?? 'Formation'),
                'status' => strtolower((string) $r->status),
                'time'   => Carbon::parse($r->time_in)->setTimezone($tz)->format('M d, h:i A'),
            ]);

        return [
            'totalCadets'    => Attendance::cadetsQuery()->count(),
            'upcomingEvents' => FormationEvent::whereDate('formation_date', '>=', $today)->count(),
            'today'          => [
                'present' => $todayRecords->where('status', 'present')->count(),
                'late'    => $todayRecords->where('status', 'late')->count(),
                'excused' => $todayRecords->where('status', 'excused')->count(),
                'absent'  => $todayRecords->where('status', 'absent')->count(),
            ],
            'recentActivity' => $recent->values(),
        ];
    }

    public static function upcomingEvents(string $today): array
    {
        return FormationEvent::with('sessions')
            ->whereDate('formation_date', '>=', $today)
            ->orderBy('formation_date')
            ->limit(5)
            ->get()
            ->map(function (FormationEvent $e) {
                $first = $e->sessions->sortBy('start_time')->first();

                return [
                    'id'       => $e->formation_id,
                    'name'     => $e->formation_name,
                    'date'     => $e->formation_date?->format('M d, Y'),
                    'time'     => $first?->start_time ? Carbon::parse($first->start_time)->format('h:i A') : 'TBA',
                    'sessions' => $e->sessions->count(),
                ];
            })
            ->all();
    }
}
