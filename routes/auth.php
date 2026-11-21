<?php

use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

Route::middleware('supabase.guest')->group(function () {
    Route::get('/register', [AuthController::class, 'showRegister'])->name('register');
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:register');

    Route::get('/register/verify', [AuthController::class, 'showVerify'])->name('register.verify');
    Route::post('/register/verify', [AuthController::class, 'verify'])->middleware('throttle:otp');
    Route::post('/register/resend', [AuthController::class, 'resend'])->middleware('throttle:email')->name('register.resend');

    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');
});

// Forgot / change password: open to guests and logged-in users (Settings links here).
Route::get('/forgot-password', [AuthController::class, 'showForgot'])->name('password.request');
Route::post('/forgot-password', [AuthController::class, 'sendReset'])->middleware('throttle:email')->name('password.email');

// Email links (sign-up confirmation and password reset). Not guest-only:
// the link may be opened in a browser that is already logged in.
Route::get('/auth/confirm', [AuthController::class, 'confirmLink'])->middleware('throttle:otp')->name('auth.confirm');

// Reset password: enter code -> set new password (user is logged in after the code/link).
Route::get('/reset-password', [AuthController::class, 'showReset'])->name('password.reset');
Route::post('/reset-password/code', [AuthController::class, 'verifyResetCode'])->middleware('throttle:otp')->name('password.code');
Route::post('/reset-password', [AuthController::class, 'resetPassword'])->middleware('supabase.auth', 'throttle:account')->name('password.store');

Route::post('/logout', [AuthController::class, 'logout'])
    ->middleware('supabase.auth', 'throttle:account')
    ->name('logout');
