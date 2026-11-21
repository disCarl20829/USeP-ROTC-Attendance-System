<?php

namespace App\Http\Controllers\Attendance;

use App\Http\Controllers\Controller;
use App\Models\AttendanceRecord;
use App\Support\Attendance;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AttendanceController extends Controller
{
    public function index()
    {
        $tz       = config('rotc.timezone');
        $sessions = Attendance::sessions()->reverse()->values(); // newest first

        $cadets = Attendance::cadetsQuery()->get()->map(fn ($u) => [
            'user_id'   => $u->user_id,
            'name'      => trim("{$u->last_name}, {$u->first_name}" . ($u->middle_initial ? " {$u->middle_initial}." : '')),
            'id_number' => (string) ($u->student_id ?? ''),
            'platoon'   => $u->platoon?->platoon_name ?? 'Unspecified',
        ])->values();

        $records = AttendanceRecord::whereIn('user_id', $cadets->pluck('user_id'))
            ->get()
            ->map(fn ($r) => [
                'record_id'  => $r->record_id,
                'user_id'    => $r->user_id,
                'session_id' => $r->session_id,
                'time_in'    => $r->time_in ? Carbon::parse($r->time_in)->setTimezone($tz)->format('h:i A') : '--:--',
                'time_out'   => $r->time_out ? Carbon::parse($r->time_out)->setTimezone($tz)->format('h:i A') : '--:--',
                'status'     => strtolower((string) $r->status),
            ])->values();

        return Inertia::render('Attendance', [
            'sessions' => $sessions,
            'cadets'   => $cadets,
            'records'  => $records,
            'points'   => config('rotc.points'),
        ]);
    }

    /** Latest scans for the scanner page. */
    public function recent(Request $request)
    {
        $tz = config('rotc.timezone');

        $query = AttendanceRecord::with('user')
            ->whereNotNull('time_in')
            ->orderByDesc('time_in')
            ->limit(15);

        if ($request->filled('session_id')) {
            $query->where('session_id', (int) $request->input('session_id'));
        }

        return response()->json($query->get()->map(fn ($r) => [
            'record_id'  => $r->record_id,
            'session_id' => $r->session_id,
            'name'       => $r->user?->full_name ?? 'Cadet',
            'student_id' => $r->user?->student_id,
            'status'     => $r->status,
            'time_in'    => $r->time_in ? Carbon::parse($r->time_in)->setTimezone($tz)->format('h:i A') : null,
            'time_out'   => $r->time_out ? Carbon::parse($r->time_out)->setTimezone($tz)->format('h:i A') : null,
        ])->values());
    }
}
