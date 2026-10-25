<?php

namespace App\Http\Controllers\Attendance;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAttendanceRequest;
use App\Models\AttendanceRecord;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    public function index()
    {
        $records = AttendanceRecord::with(['user', 'session'])
            ->latest('date_added')
            ->get();

        return response()->json($records);
    }

    public function store(StoreAttendanceRequest $request)
    {
        $validated = $request->validated();

        $record = AttendanceRecord::updateOrCreate(
            [
                'user_id' => $validated['user_id'],
                'session_id' => $validated['session_id'],
            ],
            [
                'time_in' => $validated['time_in'] ?? now(),
                'time_out' => $validated['time_out'] ?? null,
                'status' => $validated['status'],
            ]
        );

        return response()->json($record->load(['user', 'session']), 201);
    }
}
