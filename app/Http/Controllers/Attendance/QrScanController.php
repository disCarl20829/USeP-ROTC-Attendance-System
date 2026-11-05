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
                ->get();
        }

        return response()->json($events);
    }

    /**
     * Scan Handler enforcing In/Out sequence and single-record database logging
     */
    public function scan(ScanAttendanceRequest $request)
    {
        $validated = $request->validated();
        $rawInput  = trim($validated['student_id_number'] ?? $validated['student_id'] ?? '');

        // Extract student ID pattern (e.g., 2026-00382)
        if (preg_match('/\d{4}-\d{4,6}/', $rawInput, $matches)) {
            $scannedId = $matches[0];
        } else {
            $scannedId = $rawInput;
        }

        // 1. Locate Cadet in Database across all potential user ID fields
        $query = UserInfo::where('email', 'LIKE', $scannedId . '@%')
            ->orWhere('email', 'LIKE', '%' . $scannedId . '%');

        if (\Schema::hasColumn('user_info', 'serial_number')) {
            $query->orWhere('serial_number', $scannedId);
        }
        if (\Schema::hasColumn('user_info', 'student_id_number')) {
            $query->orWhere('student_id_number', $scannedId);
        }
        if (Str::isUuid($scannedId)) {
            $query->orWhere('user_id', $scannedId);
        }

        $userInfo = $query->first();

        if (!$userInfo) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Cadet with ID "' . $scannedId . '" not found in database.',
            ], 404);
        }

        // 2. Validate Formation Session
        $session = FormationSession::find($validated['session_id']);

        if (!$session) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Formation session not found.',
            ], 404);
        }

        // Normalize scan type to 'In' or 'Out'
        $rawType  = $validated['scan_type'] ?? $validated['type'] ?? 'In';
        $scanType = in_array(strtolower($rawType), ['in', 'entry']) ? 'In' : 'Out';

        // 3. Query existing attendance record for this exact cadet and session
        $record = AttendanceRecord::where('user_id', $userInfo->user_id)
            ->where('session_id', $session->session_id)
            ->first();

        if (!$record) {
            $record = new AttendanceRecord([
                'user_id'    => $userInfo->user_id,
                'session_id' => $session->session_id,
            ]);
        }

        $now = Carbon::now('Asia/Manila');
        $cadetName = trim("{$userInfo->first_name} {$userInfo->last_name}");

        // 4. Handle "IN" Scan Logic
        if ($scanType === 'In') {
            if ($record->exists && $record->time_in) {
                return response()->json([
                    'status'  => 'error',
                    'message' => "Cadet {$cadetName} has already logged IN for this session.",
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
            $record->time_in_scanned_by = $validated['scanned_by'] ?? 'System Officer';
            $record->save();

            return response()->json([
                'status'  => $status,
                'message' => "Successfully logged IN for Cadet {$cadetName}",
                'data'    => $record->load(['user', 'session']),
            ]);
        }

        // 5. Handle "OUT" Scan Logic
        if ($scanType === 'Out') {
            if (!$record->exists || !$record->time_in) {
                return response()->json([
                    'status'  => 'error',
                    'message' => "Cannot log OUT. Cadet {$cadetName} has not logged IN for this session.",
                ], 422);
            }

            if ($record->time_out) {
                return response()->json([
                    'status'  => 'error',
                    'message' => "Cadet {$cadetName} has already logged OUT for this session.",
                ], 422);
            }

            $record->time_out            = $now;
            $record->time_out_scanned_by = $validated['scanned_by'] ?? 'System Officer';
            $record->save();

            return response()->json([
                'status'  => 'success',
                'message' => "Successfully logged OUT for Cadet {$cadetName}",
                'data'    => $record->load(['user', 'session']),
            ]);
        }
    }
}