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
        // 1. Fetch ALL formation sessions
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

        // Helper function to resolve cadet ID across column variations
        $resolveCadetId = function ($user) {
            if (!$user) return 'N/A';

            $candidates = [
                $user->student_id_number ?? null,
                $user->serial_number ?? null,
                $user->student_id ?? null,
                $user->id_number ?? null,
                ($user->email && str_contains($user->email, '@')) ? explode('@', $user->email)[0] : null,
            ];

            foreach ($candidates as $candidate) {
                if (!is_null($candidate) && trim((string) $candidate) !== '') {
                    return trim((string) $candidate);
                }
            }

            return 'N/A';
        };

        // 2. Fetch all registered cadets
        $cadets = UserInfo::orderBy('last_name', 'asc')
            ->orderBy('first_name', 'asc')
            ->get()
            ->map(function ($user) use ($resolveCadetId) {
                $firstName = $user->first_name ?? '';
                $lastName  = $user->last_name ?? '';
                $fullName  = trim("{$lastName}, {$firstName}");

                return [
                    'user_id'   => $user->user_id ?? $user->info_id,
                    'name'      => $fullName ?: 'Unknown Cadet',
                    'id_number' => $resolveCadetId($user),
                ];
            })
            ->values();

        // 3. Fetch attendance scan records with linked UserInfo
        $records = AttendanceRecord::with('user')
            ->orderBy('date_added', 'desc')
            ->get()
            ->map(function ($record) use ($resolveCadetId) {
                $user      = $record->user;
                $firstName = $user->first_name ?? '';
                $lastName  = $user->last_name ?? '';
                $fullName  = trim("{$firstName} {$lastName}");

                $idNumber = $resolveCadetId($user);

                $timeIn  = $record->time_in ? Carbon::parse($record->time_in)->format('h:i A') : '--:--';
                $timeOut = $record->time_out ? Carbon::parse($record->time_out)->format('h:i A') : '--:--';

                return [
                    'record_id'         => $record->record_id ?? $record->id,
                    'id'                => $record->record_id ?? $record->id,
                    'user_id'           => $record->user_id,
                    'session_id'        => (string) $record->session_id,
                    'student_name'      => $fullName ?: 'Cadet',
                    'student_id_number' => $idNumber,
                    'time_in'           => $timeIn,
                    'time_out'          => $timeOut,
                    'status'            => strtolower($record->status ?? 'present'),
                    'user'              => $user ? [
                        'first_name'        => $firstName,
                        'last_name'         => $lastName,
                        'name'              => $fullName,
                        'student_id_number' => $idNumber,
                        'serial_number'     => $idNumber,
                    ] : null,
                ];
            })->values();

        if (request()->is('api/*')) {
            return response()->json($records);
        }

        return Inertia::render('Attendance', [
            'sessions' => $sessions,
            'cadets'   => $cadets,
            'records'  => $records,
        ]);
    }
}