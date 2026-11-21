<?php

use App\Http\Controllers\Attendance\AttendanceController;
use App\Http\Controllers\Attendance\QrScanController;
use Illuminate\Support\Facades\Route;

// JSON endpoints used by the QR scanner (axios). Session + CSRF via the web group.
Route::middleware(['web', 'supabase.auth', 'profile.complete', 'permission:scan'])->group(function () {
    Route::get('/events', [QrScanController::class, 'getEvents']);
    Route::get('/attendance/recent', [AttendanceController::class, 'recent']);
    Route::post('/attendance/scan', [QrScanController::class, 'scan'])->middleware('throttle:scan');
    Route::patch('/attendance/{recordId}/status', [QrScanController::class, 'changeStatus'])->whereNumber('recordId');
});
