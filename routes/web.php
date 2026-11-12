<?php

use App\Http\Controllers\Attendance\AttendanceController;
use App\Http\Controllers\Attendance\QrScanController;
use App\Http\Controllers\Attendance\ReportController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\CadetController;
use App\Http\Controllers\CadetPortalController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SettingsController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
})->name('home');

Route::middleware('supabase.auth')->group(function () {
    // Primary Entry Point
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Authentication Session Handling
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');

    // Profile Settings
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');

    // Cadet Portal Access Group
    Route::middleware('role:cadet,aspirant,officer,admin,test')->group(function () {
        Route::get('/cadet/portal', [CadetPortalController::class, 'index'])->name('cadet.portal');
    });

    // Scanner & Attendance Roster
    Route::middleware('role:aspirant,officer,scanner,admin,test')->group(function () {
        Route::get('/attendance', [AttendanceController::class, 'index'])->name('attendance');
        Route::get('/qr-scanner', [QrScanController::class, 'showScannerPage'])->name('qr-scanner');
    });

    // Executive & Admin Management Group
    Route::middleware('role:admin,officer,system admin,test')->group(function () {
        Route::get('/cadets', [CadetController::class, 'index'])->name('cadets');
        Route::post('/cadets', [CadetController::class, 'store'])->name('cadets.store');
        Route::put('/cadets/{id}', [CadetController::class, 'update'])->name('cadets.update');
        Route::delete('/cadets/{id}', [CadetController::class, 'destroy'])->name('cadets.destroy');

        Route::get('/events', [EventController::class, 'index'])->name('events');
        Route::post('/events', [EventController::class, 'store'])->name('events.store');
        Route::put('/events/{id}', [EventController::class, 'update'])->name('events.update');
        Route::delete('/events/{id}', [EventController::class, 'destroy'])->name('events.destroy');

        Route::get('/reports', [ReportController::class, 'index'])->name('reports');
        Route::get('/reports/export-excel', [ReportController::class, 'exportExcel'])->name('reports.export-excel'); // Added export route
        
        Route::get('/settings', [SettingsController::class, 'index'])->name('settings');
    });
});

require __DIR__ . '/auth.php';