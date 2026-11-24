<?php

namespace App\Http\Controllers;

use App\Models\AttendanceRecord;
use App\Models\FormationEvent;
use App\Models\FormationSession;
use App\Support\Attendance;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class EventController extends Controller
{
    public function index()
    {
        $tz          = config('rotc.timezone');
        $today       = Carbon::now($tz)->startOfDay();
        $totalCadets = max(1, Attendance::cadetsQuery()->count());

        $events = FormationEvent::with('sessions')
            ->orderByDesc('formation_date')
            ->get()
            ->map(function (FormationEvent $event) use ($totalCadets, $today) {
                $sorted    = $event->sessions->sortBy('start_time')->values();
                $session   = $sorted->first();
                $last      = $sorted->last();
                $attendees = AttendanceRecord::whereIn('session_id', $event->sessions->pluck('session_id'))
                    ->whereIn('status', ['present', 'late', 'excused'])
                    ->distinct('user_id')
                    ->count('user_id');

                return [
                    'id'             => $event->formation_id,
                    'name'           => $event->formation_name,
                    'formation_name' => $event->formation_name,
                    'date'           => $event->formation_date?->format('M d, Y'),
                    'rawDate'        => $event->formation_date?->toDateString(),
                    'raw_date'       => $event->formation_date?->toDateString(),
                    'time'           => $session
                        ? Carbon::parse($session->start_time)->format('h:i A') . ' – ' . Carbon::parse($last->end_time)->format('h:i A')
                        : 'TBA',
                    'sessions'       => $sorted->map(fn ($x) => [
                        'type'       => $x->session_type,
                        'start_time' => substr((string) $x->start_time, 0, 5),
                        'late_time'  => substr((string) $x->late_time, 0, 5),
                        'end_time'   => substr((string) $x->end_time, 0, 5),
                    ])->all(),
                    'start_time'     => $session?->start_time ? substr($session->start_time, 0, 5) : '',
                    'end_time'       => $session?->end_time ? substr($session->end_time, 0, 5) : '',
                    'late_time'      => $session?->late_time ? substr($session->late_time, 0, 5) : '',
                    'location'       => $event->location ?? '',
                    'attendees'      => $attendees,
                    'capacity'       => $totalCadets,
                    'status'         => $event->formation_date && $event->formation_date->gte($today) ? 'upcoming' : 'completed',
                    'type'           => $event->formation_type,
                    'formation_type' => $event->formation_type,
                ];
            });

        $u = \App\Models\Utility::find(1);

        return Inertia::render('Events', [
            'events'   => $events,
            'defaults' => [
                'start_time' => substr((string) ($u->default_start_time ?? '08:00'), 0, 5),
                'end_time'   => substr((string) ($u->default_end_time ?? '17:00'), 0, 5),
                'late_time'  => substr((string) ($u->default_late_time ?? '08:15'), 0, 5),
            ],
        ]);
    }

    private function validated(Request $request): array
    {
        $whole = $request->input('formation_type') === 'whole_day';
        $types = $whole ? ['morning', 'afternoon'] : [(string) $request->input('half_session', 'morning')];

        $rules = [
            'formation_name' => ['required', 'string', 'max:255'],
            'formation_date' => ['required', 'date'],
            'formation_type' => ['required', 'in:whole_day,half_day'],
            'half_session'   => ['required_if:formation_type,half_day', 'in:morning,afternoon'],
            'location'       => ['nullable', 'string', 'max:255'],
        ];

        foreach ($types as $t) {
            $rules["{$t}_start"] = ['required', 'date_format:H:i'];
            $rules["{$t}_end"]   = ['required', 'date_format:H:i', "after:{$t}_start"];
            $rules["{$t}_late"]  = ['required', 'date_format:H:i', "after_or_equal:{$t}_start", "before_or_equal:{$t}_end"];
        }

        if ($whole) {
            $rules['afternoon_start'][] = 'after_or_equal:morning_end';
        }

        $data = $request->validate($rules, [
            'afternoon_start.after_or_equal' => 'The afternoon session must start after the morning session ends.',
        ]);

        $data['session_types'] = $types;

        return $data;
    }

    private function sessionValues(array $data, string $type): array
    {
        return [
            'start_time' => $data["{$type}_start"],
            'late_time'  => $data["{$type}_late"],
            'end_time'   => $data["{$type}_end"],
        ];
    }

    public function store(Request $request)
    {
        $data = $this->validated($request);

        DB::transaction(function () use ($data, $request) {
            $event = FormationEvent::create([
                'formation_name' => $data['formation_name'],
                'formation_date' => $data['formation_date'],
                'formation_type' => $data['formation_type'],
                'location'       => $data['location'] ?? null,
                'school_year_id' => \App\Models\SchoolYear::active()?->school_year_id,
                'created_by'     => $request->session()->get('supabase_user_id'),
            ]);

            foreach ($data['session_types'] as $type) {
                FormationSession::create([
                    'formation_id' => $event->formation_id,
                    'session_type' => $type,
                    ...$this->sessionValues($data, $type),
                ]);
            }
        });

        return back()->with('success', 'Event created.');
    }

    public function update(Request $request, int $id)
    {
        $event = FormationEvent::with('sessions')->findOrFail($id);
        $data  = $this->validated($request);

        // Removing a session would delete its attendance; only allow it when empty.
        $removed = $event->sessions->whereNotIn('session_type', $data['session_types']);
        foreach ($removed as $session) {
            if (AttendanceRecord::where('session_id', $session->session_id)->exists()) {
                return back()->with('error', "The {$session->session_type} session already has attendance records and can't be removed.");
            }
        }

        DB::transaction(function () use ($event, $data, $removed) {
            $event->update([
                'formation_name' => $data['formation_name'],
                'formation_date' => $data['formation_date'],
                'formation_type' => $data['formation_type'],
                'location'       => $data['location'] ?? null,
            ]);

            foreach ($removed as $session) {
                $session->delete();
            }

            foreach ($data['session_types'] as $type) {
                FormationSession::updateOrCreate(
                    ['formation_id' => $event->formation_id, 'session_type' => $type],
                    $this->sessionValues($data, $type)
                );
            }
        });

        return back()->with('success', 'Event updated.');
    }

    public function destroy(int $id)
    {
        $event = FormationEvent::with('sessions')->findOrFail($id);

        DB::transaction(function () use ($event) {
            // Attendance rows cascade from formation_sessions.
            FormationSession::where('formation_id', $event->formation_id)->delete();
            $event->delete();
        });

        return back()->with('success', 'Event deleted.');
    }
}
