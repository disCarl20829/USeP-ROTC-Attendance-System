<?php

namespace App\Http\Controllers\Attendance;

use App\Http\Controllers\Controller;
use App\Models\AttendanceRecord;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function index()
    {
        $records = AttendanceRecord::with(['user', 'session'])->get();

        return response()->json([
            'records' => $records,
            'summary' => [
                'total' => $records->count(),
                'present' => $records->where('status', 'present')->count(),
                'late' => $records->where('status', 'late')->count(),
                'absent' => $records->where('status', 'absent')->count(),
            ],
        ]);
    }
}
