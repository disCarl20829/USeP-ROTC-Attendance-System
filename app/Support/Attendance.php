<?php

namespace App\Support;

use App\Models\FormationSession;
use App\Models\UserInfo;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

/** Shared attendance queries (roster, sessions, points). */
class Attendance
{
    /** Active cadets and aspirants: the people attendance is taken for. */
    public static function cadetsQuery(bool $includeDropped = false): Builder
    {
        return UserInfo::query()
            ->with(['course', 'platoon', 'specialization'])
            ->whereHas('role', fn ($q) => $q->whereIn(\DB::raw('lower(role_name)'), config('rotc.attendance_roles')))
            ->when(!$includeDropped, fn ($q) => $q->where('status', 'active'))
            ->orderBy('last_name')
            ->orderBy('first_name');
    }

    /** All sessions ordered by date + start time, with label and "ended" flag. */
    public static function sessions(): Collection
    {
        $tz  = config('rotc.timezone');
        $now = Carbon::now($tz);

        return FormationSession::with('formation')
            ->join('formations_event', 'formations_event.formation_id', '=', 'formation_sessions.formation_id')
            ->select('formation_sessions.*')
            ->orderBy('formations_event.formation_date')
            ->orderBy('formation_sessions.start_time')
            ->get()
            ->map(function (FormationSession $s) use ($tz, $now) {
                $date  = $s->formation?->formation_date?->toDateString();
                $end   = $date && $s->end_time ? Carbon::parse("{$date} {$s->end_time}", $tz) : null;

                return [
                    'session_id' => $s->session_id,
                    'label'      => ucfirst((string) $s->session_type) . ' — ' . ($s->formation?->formation_name ?? 'Formation')
                        . ($date ? ' (' . Carbon::parse($date)->format('M d, Y') . ')' : ''),
                    'name'       => $s->formation?->formation_name,
                    'type'       => $s->session_type,
                    'date'       => $date,
                    'short_date' => $date ? Carbon::parse($date)->format('m/d') : '',
                    'ended'      => $end ? $end->lte($now) : false,
                ];
            })
            ->values();
    }

    public static function maxPoints(int $sessionCount): int
    {
        return $sessionCount * max(config('rotc.points'));
    }
}
