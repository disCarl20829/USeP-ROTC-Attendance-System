<?php

namespace App\Http\Controllers\Attendance;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAttendanceRequest;
use App\Models\AttendanceRecord;
use App\Models\FormationSession;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AttendanceController extends Controller
{
    public function index()
    {
        // 1. Fetch attendance records with related user and session formation
        $rawRecords = AttendanceRecord::with(['user', 'session.formation'])
            ->latest('date_added')
            ->get();

        // 2. Format records array for frontend consumption
        $records = $rawRecords->map(function ($record) {
            $user = $record->user;
            $session = $record->session;
            $formation = $session?->formation;

            $firstName = $user?->first_name ?? '';
            $lastName = $user?->last_name ?? '';
            $cadetName = trim("{$firstName} {$lastName}") ?: 'Unknown Cadet';

            // Extract Student ID Number from email prefix (e.g., 2026-00382@usep.edu.ph -> 2026-00382)
            $idNumber = $user?->email ? explode('@', $user->email)[0] : 'N/A';

            $sessionType = $session?->session_type ? ucfirst($session->session_type) . ' Session' : '';
            $formationName = $formation?->formation_name ?? 'Formation';
            $eventName = $sessionType ? "{$sessionType} — {$formationName}" : $formationName;

            $timeIn = $record->time_in ? Carbon::parse($record->time_in) : null;
            $formattedDate = $timeIn ? $timeIn->format('M d, Y') : 'N/A';
            $formattedTime = $timeIn ? $timeIn->format('h:i A') : '-';

            return [
                'id'        => $record->record_id ?? $record->id,
                'cadet'     => $cadetName,
                'idNumber'  => $idNumber,
                'event'     => $eventName,
                'date'      => $formattedDate,
                'rawDate'   => $timeIn ? $timeIn->format('Y-m-d') : '',
                'time'      => $formattedTime,
                'status'    => strtolower($record->status ?? 'absent'),
            ];
        });

        // 3. Calculate summary stats directly from the raw database records collection
        $stats = [
            'present' => $rawRecords->where('status', 'present')->count(),
            'late'    => $rawRecords->where('status', 'late')->count(),
            'absent'  => $rawRecords->where('status', 'absent')->count(),
        ];

        // 4. Extract unique formation event names for filtering dropdown
        $events = FormationSession::with('formation')
            ->get()
            ->map(fn($s) => $s->formation?->formation_name)
            ->filter()
            ->unique()
            ->values();

        return Inertia::render('Attendance', [
            'records' => $records,
            'stats'   => $stats,
            'events'  => $events,
        ]);
    }

    public function store(StoreAttendanceRequest $request)
    {
        $validated = $request->validated();

        $record = AttendanceRecord::updateOrCreate(
            [
                'user_id'    => $validated['user_id'],
                'session_id' => $validated['session_id'],
            ],
            [
                'time_in'  => $validated['time_in'] ?? now(),
                'time_out' => $validated['time_out'] ?? null,
                'status'   => $validated['status'],
            ]
        );

        return response()->json($record->load(['user', 'session']), 201);
    }
}