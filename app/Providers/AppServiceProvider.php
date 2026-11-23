<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        $this->configureRateLimits();
    }

    /**
     * Limits are counted per email / per user, with a generous per-IP cap,
     * because many cadets share one campus Wi-Fi IP address.
     */
    private function configureRateLimits(): void
    {
        // Show a normal form error instead of the bare "429 Too Many Requests" page.
        $tooMany = fn (string $field, string $message) => fn (Request $r, array $headers) => $r->expectsJson()
            ? response()->json(['message' => $message], 429, $headers)
            : back()->withInput($r->except('password', 'password_confirmation'))->withErrors([$field => $message]);

        $email = fn (Request $r) => strtolower(trim((string) ($r->input('email') ?: $r->session()->get('pending_email') ?: $r->session()->get('reset_email'))));
        $who   = fn (Request $r) => (string) ($r->session()->get('supabase_user_id') ?: $r->ip());

        RateLimiter::for('login', fn (Request $r) => [
            Limit::perMinute(5)->by('login:' . $email($r) . '|' . $r->ip())->response($tooMany('email', 'Too many login attempts. Wait a minute and try again.')),
            Limit::perMinute(120)->by('login-ip:' . $r->ip())->response($tooMany('email', 'Too many login attempts from this network. Wait a minute and try again.')),
        ]);

        RateLimiter::for('register', fn (Request $r) => [
            Limit::perMinute(5)->by('register:' . $email($r))->response($tooMany('email', 'Too many sign-up attempts. Wait a minute and try again.')),
            Limit::perMinute(60)->by('register-ip:' . $r->ip())->response($tooMany('email', 'Too many sign-up attempts from this network. Wait a minute and try again.')),
        ]);

        // Checking a 6-digit code: few tries per email, so codes can't be guessed.
        RateLimiter::for('otp', fn (Request $r) => [
            Limit::perMinute(5)->by('otp:' . ($email($r) ?: $r->ip()))->response($tooMany('code', 'Too many tries. Wait a minute, then enter the newest code.')),
            Limit::perMinute(120)->by('otp-ip:' . $r->ip())->response($tooMany('code', 'Too many tries from this network. Wait a minute and try again.')),
        ]);

        // Anything that sends an email.
        RateLimiter::for('email', fn (Request $r) => [
            Limit::perMinute(2)->by('email:' . $email($r))->response($tooMany('email', 'You just asked for an email. Wait a minute before asking again, and check your inbox and spam folder.')),
            Limit::perMinute(30)->by('email-ip:' . $r->ip())->response($tooMany('email', 'Too many email requests from this network. Wait a minute and try again.')),
        ]);

        RateLimiter::for('account', fn (Request $r) => Limit::perMinute(20)->by('account:' . $who($r)));

        RateLimiter::for('scan', fn (Request $r) => Limit::perMinute(240)->by('scan:' . $who($r)));
    }
}
