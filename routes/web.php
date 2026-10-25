<?php

use App\Http\Controllers\Attendance\AttendanceController;
use App\Http\Controllers\Attendance\QrScanController;
use App\Http\Controllers\Attendance\ReportController;
use App\Http\Controllers\CadetController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SettingsController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Public landing page
Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
})->name('home');

// Protected pages: Supabase-authenticated users only
Route::middleware('supabase.auth')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])
        ->name('dashboard');

    Route::get('/profile', [ProfileController::class, 'edit'])
        ->name('profile.edit');

    Route::patch('/profile', [ProfileController::class, 'update'])
        ->name('profile.update');

    // Keep this route only if your ProfileController implements account deletion
    // safely through Supabase Auth. Otherwise, remove it for now.
    // Route::delete('/profile', [ProfileController::class, 'destroy'])
    //     ->name('profile.destroy');

    // ROTC QR Attendance System
    Route::get('/cadets', [CadetController::class, 'index'])
        ->name('cadets');

    Route::get('/events', [EventController::class, 'index'])
        ->name('events');

    Route::get('/attendance', [AttendanceController::class, 'index'])
        ->name('attendance');

    Route::get('/qr-scanner', [QrScanController::class, 'index'])
        ->name('qr-scanner');

    Route::get('/reports', [ReportController::class, 'index'])
        ->name('reports');

    Route::get('/settings', [SettingsController::class, 'index'])
        ->name('settings');
});

// Make sure routes/auth.php contains your custom Supabase auth routes,
// not the original Laravel Breeze authentication routes.
require __DIR__ . '/auth.php';