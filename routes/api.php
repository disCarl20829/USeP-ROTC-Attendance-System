<?php

use App\Http\Controllers\Attendance\AttendanceController;
use App\Http\Controllers\Attendance\QrScanController;
use App\Http\Controllers\Attendance\ReportController;
use App\Http\Controllers\CadetController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\SettingsController;
use Illuminate\Support\Facades\Route;

// The api file is already mounted under /api by bootstrap/app.php.
// The `web` group is required because Supabase auth is stored in the
// Laravel session (StartSession + CSRF for axios).
Route::middleware(['web', 'supabase.auth'])->group(function () {
    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // Cadets
    Route::get('/cadets', [CadetController::class, 'index']);
    Route::post('/cadets', [CadetController::class, 'store']);
    Route::put('/cadets/{id}', [CadetController::class, 'update']);
    Route::delete('/cadets/{id}', [CadetController::class, 'destroy']);

    // Events / Formations
    Route::get('/events', [EventController::class, 'index']);
    Route::post('/events', [EventController::class, 'store']);
    Route::put('/events/{id}', [EventController::class, 'update']);
    Route::delete('/events/{id}', [EventController::class, 'destroy']);

    // Attendance
    Route::get('/attendance', [AttendanceController::class, 'index']);
    Route::post('/attendance', [AttendanceController::class, 'store']);
    Route::post('/attendance/scan', [QrScanController::class, 'scan']);

    // Reports
    Route::get('/reports', [ReportController::class, 'index']);

    // Settings
    Route::get('/settings', [SettingsController::class, 'index']);
    Route::put('/settings', [SettingsController::class, 'update']);
});
