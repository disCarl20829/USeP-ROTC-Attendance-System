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
                $session   = $event->sessions->sortBy('start_time')->first();
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
                    'time'           => $session?->start_time ? Carbon::parse($session->start_time)->format('h:i A') : 'TBA',
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

    private function rules(): array
    {
        return [
            'formation_name' => ['required', 'string', 'max:255'],
            'formation_date' => ['required', 'date'],
            'formation_type' => ['required', 'in:whole_day,half_day'],
            'location'       => ['nullable', 'string', 'max:255'],
            'start_time'     => ['required', 'date_format:H:i'],
            'end_time'       => ['required', 'date_format:H:i', 'after:start_time'],
            'late_time'      => ['required', 'date_format:H:i', 'after_or_equal:start_time', 'before_or_equal:end_time'],
        ];
    }

    public function store(Request $request)
    {
        $data = $request->validate($this->rules());

        DB::transaction(function () use ($data, $request) {
            $event = FormationEvent::create([
                'formation_name' => $data['formation_name'],
                'formation_date' => $data['formation_date'],
                'formation_type' => $data['formation_type'],
                'location'       => $data['location'] ?? null,
                'created_by'     => $request->session()->get('supabase_user_id'),
            ]);

            FormationSession::create([
                'formation_id' => $event->formation_id,
                'session_type' => $data['start_time'] < '12:00' ? 'morning' : 'afternoon',
                'start_time'   => $data['start_time'],
                'end_time'     => $data['end_time'],
                'late_time'    => $data['late_time'],
            ]);
        });

        return back()->with('success', 'Event created.');
    }

    public function update(Request $request, int $id)
    {
        $event = FormationEvent::with('sessions')->findOrFail($id);
        $data  = $request->validate($this->rules());

        DB::transaction(function () use ($event, $data) {
            $event->update([
                'formation_name' => $data['formation_name'],
                'formation_date' => $data['formation_date'],
                'formation_type' => $data['formation_type'],
                'location'       => $data['location'] ?? null,
            ]);

            $session = $event->sessions->sortBy('start_time')->first();
            $values  = [
                'start_time' => $data['start_time'],
                'end_time'   => $data['end_time'],
                'late_time'  => $data['late_time'],
            ];

            $session
                ? $session->update($values)
                : FormationSession::create([
                    'formation_id' => $event->formation_id,
                    'session_type' => $data['start_time'] < '12:00' ? 'morning' : 'afternoon',
                    ...$values,
                ]);
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
