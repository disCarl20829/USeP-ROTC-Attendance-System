<?php

namespace App\Http\Controllers\Attendance;

use App\Http\Controllers\Controller;
use App\Http\Requests\ScanAttendanceRequest;
use App\Models\AttendanceRecord;
use App\Models\FormationSession;
use App\Models\UserInfo;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class QrScanController extends Controller
{
    public function showScannerPage()
    {
        return Inertia::render('QRScanner');
    }

    /**
     * Fetch active formation sessions scheduled for today (Asia/Manila time)
     */
    public function getEvents()
    {
        $today = Carbon::now('Asia/Manila')->format('Y-m-d');

        $events = FormationSession::with('formation')
            ->whereHas('formation', function ($query) use ($today) {
                $query->whereDate('formation_date', $today);
            })
            ->get();

        if ($events->isEmpty()) {
            $events = FormationSession::with('formation')
                ->where('status', '!=', 'completed')
                ->orWhereNull('status')
                ->get();
        }

        return response()->json($events);
    }

    /**
     * Scan Handler enforcing In/Out sequence and database logging
     */
    public function scan(ScanAttendanceRequest $request)
    {
        $validated = $request->validated();
        $rawInput  = trim($validated['student_id_number'] ?? $validated['student_id'] ?? '');

        // Extract student ID pattern (e.g., 2026-00382) or use raw string
        if (preg_match('/\d{4}-\d{4,6}/', $rawInput, $matches)) {
            $scannedId = $matches[0];
        } else {
            $scannedId = $rawInput;
        }

        if (empty($scannedId)) {
            return response()->json([
                'status'  => 'error',
                'message' => 'No valid Cadet ID or QR payload provided.',
            ], 422);
        }

        // 1. Locate Cadet across all database ID variations
        $userInfo = UserInfo::where(function ($query) use ($scannedId, $rawInput) {
            $query->where('student_id_number', $scannedId)
                  ->orWhere('serial_number', $scannedId)
                  ->orWhere('email', $scannedId)
                  ->orWhere('email', 'LIKE', $scannedId . '@%')
                  ->orWhere('email', 'LIKE', '%' . $rawInput . '%');

            if (Str::isUuid($scannedId) || Str::isUuid($rawInput)) {
                $query->orWhere('user_id', $scannedId)->orWhere('user_id', $rawInput);
            }
        })->first();

        if (!$userInfo) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Cadet with ID "' . $scannedId . '" was not found in the database.',
            ], 404);
        }

        // 2. Validate Formation Session
        $session = FormationSession::find($validated['session_id']);

        if (!$session) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Selected formation session not found.',
            ], 404);
        }

        // Normalize scan type to 'In' or 'Out'
        $rawType  = $validated['scan_type'] ?? $validated['type'] ?? 'In';
        $scanType = in_array(strtolower($rawType), ['in', 'entry', 'scan in']) ? 'In' : 'Out';

        $cadetUserId = $userInfo->user_id ?? $userInfo->info_id;
        $cadetName   = trim("{$userInfo->first_name} {$userInfo->last_name}") ?: 'Cadet';
        $scannedBy   = $validated['scanned_by'] ?? $request->session()->get('supabase_email') ?? 'System Officer';

        // 3. Query existing attendance record
        $record = AttendanceRecord::where('user_id', $cadetUserId)
            ->where('session_id', $session->session_id)
            ->first();

        if (!$record) {
            $record = new AttendanceRecord([
                'user_id'    => $cadetUserId,
                'session_id' => $session->session_id,
            ]);
        }

        $now = Carbon::now('Asia/Manila');

        // 4. Handle "IN" Scan Logic
        if ($scanType === 'In') {
            if ($record->exists && $record->time_in) {
                $existingTime = Carbon::parse($record->time_in)->format('h:i A');
                return response()->json([
                    'status'  => 'error',
                    'message' => "Cadet {$cadetName} already logged IN for this session at {$existingTime}.",
                ], 422);
            }

            // Determine attendance status (present vs late)
            $status = 'present';
            if ($session->late_time) {
                $lateThreshold = Carbon::parse($session->late_time, 'Asia/Manila');
                $status = $now->gt($lateThreshold) ? 'late' : 'present';
            }

            $record->time_in            = $now;
            $record->status             = $status;
            $record->date_added         = $record->date_added ?? $now;
            $record->time_in_scanned_by = $scannedBy;
            $record->save();

            return response()->json([
                'status'  => 'success',
                'message' => "Logged IN: Cadet {$cadetName} ({$scannedId}) at " . $now->format('h:i A'),
                'data'    => $record->load(['user', 'session']),
            ]);
        }

        // 5. Handle "OUT" Scan Logic
        if ($scanType === 'Out') {
            if (!$record->exists || !$record->time_in) {
                return response()->json([
                    'status'  => 'error',
                    'message' => "Cannot log OUT: Cadet {$cadetName} has not logged IN for this session yet.",
                ], 422);
            }

            if ($record->time_out) {
                $existingOutTime = Carbon::parse($record->time_out)->format('h:i A');
                return response()->json([
                    'status'  => 'error',
                    'message' => "Cadet {$cadetName} already logged OUT at {$existingOutTime}.",
                ], 422);
            }

            $record->time_out            = $now;
            $record->time_out_scanned_by = $scannedBy;
            $record->save();

            return response()->json([
                'status'  => 'success',
                'message' => "Logged OUT: Cadet {$cadetName} ({$scannedId}) at " . $now->format('h:i A'),
                'data'    => $record->load(['user', 'session']),
            ]);
        }
    }
}