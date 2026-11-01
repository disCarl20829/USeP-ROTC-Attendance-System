<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\AttendanceRecord;
use App\Models\FormationEvent;
use App\Models\FormationSession;
use App\Models\UserInfo;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EventController extends Controller
{
    public function index()
{
    $totalCadets = UserInfo::count();
    $totalCadets = $totalCadets > 0 ? $totalCadets : 1; // Prevent division by zero

    $events = FormationEvent::with(['sessions'])
        ->orderBy('formation_date', 'desc')
        ->get()
        ->map(function ($event) use ($totalCadets) {
            $eventDate = Carbon::parse($event->formation_date);
            $isUpcoming = $eventDate->isFuture() || $eventDate->isToday();
            
            // Extract session IDs belonging to this formation event
            $sessionIds = $event->sessions->pluck('session_id');

            // Count unique attendees by matching session_id instead of formation_id
            $attendeesCount = AttendanceRecord::whereIn('session_id', $sessionIds)
                ->whereIn('status', ['present', 'late'])
                ->distinct('user_id')
                ->count('user_id');

            $firstSession = $event->sessions->first();
            $startTime = $firstSession && $firstSession->start_time 
                ? Carbon::parse($firstSession->start_time)->format('h:i A') 
                : 'TBA';

            return [
                'id' => $event->formation_id,
                'name' => $event->formation_name,
                'date' => $eventDate->format('M d, Y'),
                'raw_date' => $event->formation_date,
                'time' => $startTime,
                'location' => $event->location ?? 'Parade Ground',
                'attendees' => $attendeesCount,
                'capacity' => $totalCadets,
                'status' => $isUpcoming ? 'upcoming' : 'completed',
                'type' => $event->formation_type ?? 'whole_day',
            ];
        });

    return Inertia::render('Events', [
        'events' => $events,
    ]);
}

    public function store(Request $request)
    {
        $validated = $request->validate([
            'formation_name' => 'required|string|max:255',
            'formation_date' => 'required|date',
            'formation_type' => 'required|in:whole_day,half_day',
            'location' => 'nullable|string|max:255',
            'start_time' => 'nullable|string',
            'end_time' => 'nullable|string',
        ]);

        // Get active admin/user ID safely for created_by
        $creatorId = session('supabase_user_id') 
            ?? UserInfo::first()?->user_id 
            ?? 1;

        $event = FormationEvent::create([
            'formation_name' => $validated['formation_name'],
            'formation_date' => $validated['formation_date'],
            'formation_type' => $validated['formation_type'],
            'location' => $validated['location'] ?? 'PECC Gym',
            'created_by' => $creatorId,
        ]);

        // Automatically create a default session if time is provided
        if (!empty($validated['start_time'])) {
            FormationSession::create([
                'formation_id' => $event->formation_id,
                'session_type' => 'morning',
                'start_time' => $validated['start_time'],
                'end_time' => $validated['end_time'] ?? null,
                'late_time'    => $validated['start_time'],
            ]);
        }

        return redirect()->back()->with('success', 'Event created successfully!');
    }

    public function update(Request $request, $id)
    {
        $event = FormationEvent::findOrFail($id);

        $validated = $request->validate([
            'formation_name' => 'required|string|max:255',
            'formation_date' => 'required|date',
            'formation_type' => 'required|in:whole_day,half_day',
            'location' => 'nullable|string|max:255',
        ]);

        $event->update($validated);

        return redirect()->back()->with('success', 'Event updated successfully!');
    }

    public function destroy($id)
    {
        $event = FormationEvent::findOrFail($id);
        $event->delete();

        return redirect()->back()->with('success', 'Event deleted successfully!');
    }
}