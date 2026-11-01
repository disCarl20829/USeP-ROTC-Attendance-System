<?php

namespace App\Http\Controllers\Attendance;

use App\Http\Controllers\Controller;
use App\Http\Requests\ScanAttendanceRequest;
use App\Models\AttendanceRecord;
use App\Models\FormationSession;
use App\Models\UserInfo;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class QrScanController extends Controller
{
    public function showScannerPage()
    {
        return Inertia::render('QRScanner');
    }

    public function getEvents()
    {
        $events = FormationSession::with('formation')->get();

        return response()->json($events);
    }

    public function scan(ScanAttendanceRequest $request)
{
    $validated = $request->validated();
    $rawInput = trim($validated['student_id_number']);

    // Extract student ID pattern (e.g., 2026-00382) if raw string contains a prefix
    if (preg_match('/\d{4}-\d{4,6}/', $rawInput, $matches)) {
        $scannedId = $matches[0];
    } else {
        $scannedId = $rawInput;
    }

    // Build the query searching by email prefix first
    $query = UserInfo::where('email', 'LIKE', $scannedId . '@%')
        ->orWhere('email', 'LIKE', '%' . $scannedId . '%');

    // Only query user_id if the scanned string is actually a valid UUID format
    if (\Illuminate\Support\Str::isUuid($scannedId)) {
        $query->orWhere('user_id', $scannedId);
    }

    $userInfo = $query->first();

    if (!$userInfo) {
        return response()->json([
            'status'  => 'invalid',
            'message' => 'Cadet with ID "' . $scannedId . '" not found in database.',
        ], 404);
    }

    $session = FormationSession::find($validated['session_id']);

    if (!$session) {
        return response()->json([
            'status'  => 'invalid',
            'message' => 'Formation session not found.',
        ], 404);
    }

    // Determine attendance status based on session late threshold
    $status = 'present';
    if ($session->late_time) {
        $status = now()->gt(Carbon::parse($session->late_time)) ? 'late' : 'present';
    }

    $record = AttendanceRecord::updateOrCreate(
        [
            'user_id'    => $userInfo->user_id,
            'session_id' => $session->session_id,
        ],
        [
            'time_in'            => now(),
            'time_out'           => null,
            'status'             => $status,
            'time_in_scanned_by' => $validated['scanned_by'],
        ]
    );

    return response()->json([
        'status'  => $status,
        'message' => 'Attendance logged for ' . trim($userInfo->first_name . ' ' . $userInfo->last_name),
        'data'    => $record->load(['user', 'session']),
    ]);
}
}