<?php

use App\Http\Controllers\Attendance\AttendanceController;
use App\Http\Controllers\Attendance\QrScanController;
use App\Http\Controllers\Attendance\ReportController;
use App\Http\Controllers\CadetController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\SettingsController;
use Illuminate\Support\Facades\Route;

Route::middleware(['web', 'supabase.auth'])->group(function () {
    // API JSON endpoints for Axios
    Route::get('/events', [QrScanController::class, 'getEvents']);
    Route::post('/attendance/scan', [QrScanController::class, 'scan']);

    // Other API endpoints
    Route::get('/attendance', [AttendanceController::class, 'index']);
    Route::post('/attendance', [AttendanceController::class, 'store']);
});