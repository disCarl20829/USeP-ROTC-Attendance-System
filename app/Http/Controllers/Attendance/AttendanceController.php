<?php

namespace App\Http\Controllers\Attendance;

use App\Http\Controllers\Controller;
use App\Models\AttendanceRecord;
use App\Models\FormationSession;
use App\Models\UserInfo;
use Carbon\Carbon;
use Inertia\Inertia;

class AttendanceController extends Controller
{
    public function index()
    {
        // 1. Fetch ALL formation sessions with relationship fallback mapping
        $sessions = FormationSession::with('formation')
            ->get()
            ->map(function ($session) {
                $sessionId     = $session->session_id ?? $session->id;
                $sessionType   = ucfirst($session->session_type ?? 'Formation');
                $formationName = $session->formation?->formation_name 
                    ?? $session->title 
                    ?? $session->name 
                    ?? 'Session #' . $sessionId;
                
                $dateRaw = $session->formation?->formation_date ?? $session->created_at ?? null;
                $formattedDate = $dateRaw ? Carbon::parse($dateRaw)->format('M d, Y') : '';

                return [
                    'session_id' => (string) $sessionId,
                    'label'      => "{$sessionType} — {$formationName}" . ($formattedDate ? " ({$formattedDate})" : ''),
                    'date'       => $formattedDate,
                ];
            })
            ->filter(fn($s) => !empty($s['session_id']))
            ->values();

        // 2. Fetch all registered cadets sorted alphabetically (A-Z) by last name
        $cadets = UserInfo::orderBy('last_name', 'asc')
            ->orderBy('first_name', 'asc')
            ->get()
            ->map(function ($user) {
                $firstName = $user->first_name ?? '';
                $lastName  = $user->last_name ?? '';
                $fullName  = trim("{$lastName}, {$firstName}");
                $idNumber  = $user->serial_number ?? ($user->email ? explode('@', $user->email)[0] : 'N/A');

                return [
                    'user_id'   => $user->user_id,
                    'name'      => $fullName ?: 'Unknown Cadet',
                    'id_number' => $idNumber,
                ];
            })
            ->values();

        // 3. Fetch all attendance scan records
        $records = AttendanceRecord::all()->map(function ($record) {
            $timeIn  = $record->time_in ? Carbon::parse($record->time_in)->format('h:i A') : '--:--';
            $timeOut = $record->time_out ? Carbon::parse($record->time_out)->format('h:i A') : '--:--';

            return [
                'record_id'  => $record->record_id ?? $record->id,
                'user_id'    => $record->user_id,
                'session_id' => (string) $record->session_id,
                'time_in'    => $timeIn,
                'time_out'   => $timeOut,
                'status'     => strtolower($record->status ?? 'present'),
            ];
        })->values();

        // Standard API endpoint return for QR Scanner live feed calls
        if (request()->is('api/*')) {
            return response()->json($records);
        }

        // Inertia page view rendering
        return Inertia::render('Attendance', [
            'sessions' => $sessions,
            'cadets'   => $cadets,
            'records'  => $records,
        ]);
    }
}