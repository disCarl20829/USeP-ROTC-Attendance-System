<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreEventRequest;
use App\Models\FormationEvent;
use App\Models\FormationSession;
use Illuminate\Http\Request;

class EventController extends Controller
{
    public function index()
    {
        $events = FormationEvent::with('sessions')
            ->orderBy('formation_date', 'desc')
            ->get();

        return response()->json($events);
    }

    public function store(StoreEventRequest $request)
    {
        $validated = $request->validated();

        $event = FormationEvent::create([
            'formation_name' => $validated['formation_name'],
            'formation_date' => $validated['formation_date'],
            'formation_type' => $validated['formation_type'],
            'created_by' => $validated['created_by'],
        ]);

        if (isset($validated['sessions'])) {
            foreach ($validated['sessions'] as $session) {
                FormationSession::create([
                    'formation_id' => $event->formation_id,
                    'session_type' => $session['session_type'],
                    'start_time' => $session['start_time'],
                    'end_time' => $session['end_time'],
                    'late_time' => $session['late_time'],
                ]);
            }
        }

        return response()->json($event->load('sessions'), 201);
    }

    public function update(Request $request, $id)
    {
        $event = FormationEvent::with('sessions')->findOrFail($id);

        $event->update($request->validate([
            'formation_name' => ['sometimes', 'string', 'max:255'],
            'formation_date' => ['sometimes', 'date'],
            'formation_type' => ['sometimes', 'in:whole_day,half_day'],
        ]));

        // Sessions are managed separately via FormationSession records.

        return response()->json($event->load('sessions'));
    }

    public function destroy($id)
    {
        $event = FormationEvent::findOrFail($id);
        $event->delete();

        return response()->json(null, 204);
    }
}
