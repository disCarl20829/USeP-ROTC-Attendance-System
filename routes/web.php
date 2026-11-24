<?php

use App\Http\Controllers\Attendance\AttendanceController;
use App\Http\Controllers\Attendance\QrScanController;
use App\Http\Controllers\Attendance\ReportController;
use App\Http\Controllers\CadetController;
use App\Http\Controllers\CadetPortalController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\SchoolYearController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\SetupController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', fn () => Inertia::render('Welcome', [
    'canLogin'    => true,
    'canRegister' => true,
]))->name('home');

Route::middleware('supabase.auth')->group(function () {
    // Register step 3: technical info (only for logged-in users without a profile)
    Route::get('/setup', [SetupController::class, 'show'])->name('setup');
    Route::post('/setup', [SetupController::class, 'store'])->middleware('throttle:account')->name('setup.store');

    Route::middleware('profile.complete')->group(function () {
        // Everyone with a profile
        Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
        Route::get('/cadet/portal', [CadetPortalController::class, 'index'])->name('cadet.portal');

        Route::get('/settings', [SettingsController::class, 'index'])->name('settings');
        Route::put('/settings/profile', [SettingsController::class, 'updateProfile'])->name('settings.profile');
        Route::put('/settings/system', [SettingsController::class, 'updateSystem'])
            ->middleware('permission:settings.system')->name('settings.system');

        // School years (admin)
        Route::middleware('permission:school_year.manage')->prefix('settings/school-year')->name('school-year.')->group(function () {
            Route::post('/', [SchoolYearController::class, 'store'])->name('store');
            Route::put('/{id}', [SchoolYearController::class, 'update'])->whereNumber('id')->name('update');
            Route::get('/backup', [SchoolYearController::class, 'backup'])->name('backup');
            Route::post('/close', [SchoolYearController::class, 'close'])->middleware('throttle:account')->name('close');
            Route::post('/{id}/restore', [SchoolYearController::class, 'restore'])->whereNumber('id')->name('restore');
        });

        // Scanner + roster
        Route::get('/qr-scanner', [QrScanController::class, 'showScannerPage'])
            ->middleware('permission:scan')->name('qr-scanner');
        Route::get('/attendance', [AttendanceController::class, 'index'])
            ->middleware('permission:attendance.view')->name('attendance');

        // Cadet management
        Route::middleware('permission:cadets.manage')->group(function () {
            Route::get('/cadets', [CadetController::class, 'index'])->name('cadets');
            Route::post('/cadets', [CadetController::class, 'store'])->name('cadets.store');
            Route::put('/cadets/{infoId}', [CadetController::class, 'update'])->whereNumber('infoId')->name('cadets.update');
            Route::delete('/cadets/{infoId}', [CadetController::class, 'destroy'])->whereNumber('infoId')->name('cadets.destroy');
            Route::post('/cadets/archive', [CadetController::class, 'archiveMany'])->name('cadets.archive');
            Route::post('/cadets/{infoId}/restore', [CadetController::class, 'restore'])->whereNumber('infoId')->name('cadets.restore');
        });

        // Events
        Route::middleware('permission:events.manage')->group(function () {
            Route::get('/events', [EventController::class, 'index'])->name('events');
            Route::post('/events', [EventController::class, 'store'])->name('events.store');
            Route::put('/events/{id}', [EventController::class, 'update'])->whereNumber('id')->name('events.update');
            Route::delete('/events/{id}', [EventController::class, 'destroy'])->whereNumber('id')->name('events.destroy');
        });

        // Reports
        Route::middleware('permission:reports.view')->group(function () {
            Route::get('/reports', [ReportController::class, 'index'])->name('reports');
            Route::get('/reports/export-excel', [ReportController::class, 'exportExcel'])->name('reports.export-excel');
        });
    });
});

require __DIR__ . '/auth.php';
