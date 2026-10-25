<?php

namespace App\Http\Controllers\Attendance;

use App\Http\Controllers\Controller;
use App\Http\Requests\ScanAttendanceRequest;
use App\Models\AttendanceQr;
use App\Models\AttendanceRecord;
use App\Models\FormationSession;
use App\Models\UserInfo;
use Carbon\Carbon;
use Illuminate\Http\Request;

class QrScanController extends Controller
{
    public function index()
    {
        $events = FormationSession::with('formation')->get();

        return response()->json($events);
    }

    public function scan(ScanAttendanceRequest $request)
    {
        $validated = $request->validated();

        $qr = AttendanceQr::where('qr_token', $validated['qr_token'])
            ->where('is_active', true)
            ->first();

        if (!$qr) {
            return response()->json([
                'status' => 'invalid',
                'message' => 'QR code not found or inactive',
            ], 404);
        }

        $userInfo = UserInfo::where('user_id', $qr->user_id)->first();
        $session = FormationSession::with('formation')->find($validated['session_id']);

        if (!$userInfo || !$session) {
            return response()->json([
                'status' => 'invalid',
                'message' => 'Cadet or session not found',
            ], 404);
        }

        $status = 'present';
        if ($session->late_time) {
            $timeIn = $session->time_in ? Carbon::parse($session->time_in) : now();
            $lateAt = Carbon::parse($session->late_time);
            $status = $timeIn->gt($lateAt) ? 'late' : 'present';
        }

        $record = AttendanceRecord::updateOrCreate(
            [
                'user_id' => $qr->user_id,
                'session_id' => $session->session_id,
            ],
            [
                'time_in' => now(),
                'time_out' => null,
                'status' => $status,
                'time_in_scanned_by' => $validated['scanned_by'],
            ]
        );

        return response()->json([
            'status' => $status,
            'data' => $record->load(['user', 'session']),
        ]);
    }
}
