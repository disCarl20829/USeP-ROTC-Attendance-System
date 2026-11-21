<?php

namespace App\Http\Controllers;

use App\Services\Supabase;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Response as HttpResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

/**
 * Supabase Auth: register -> verify email (code or link) -> setup -> dashboard,
 * login / logout, and forgot password (code or link).
 */
class AuthController extends Controller
{
    private const UNAVAILABLE = 'The authentication service is temporarily unavailable. Please try again.';

    public function __construct(private Supabase $supabase)
    {
    }

    /* ------------------------------------------------------------------ */
    /* Validation helpers                                                  */
    /* ------------------------------------------------------------------ */

    private function emailRules(): array
    {
        return ['required', 'string', 'email:rfc', 'max:254', 'regex:/^[^@\s]+@usep\.edu\.ph$/i'];
    }

    private function newPasswordRules(): array
    {
        return ['required', 'string', 'min:12', 'max:128', 'confirmed'];
    }

    private function normalizeEmail(string $email): string
    {
        return strtolower(trim($email));
    }

    /** Turn a Supabase error into a friendly message. */
    private function errorMessage(HttpResponse $response, string $fallback): string
    {
        $code = (string) ($response->json('error_code') ?? $response->json('code') ?? '');

        return match (true) {
            $response->status() === 429, str_contains($code, 'rate_limit')
                => 'Too many attempts. Please wait a minute and try again.',
            $code === 'weak_password'
                => 'That password is too weak. Use at least 12 characters with letters and numbers.',
            in_array($code, ['otp_expired', 'otp_disabled'], true), $response->status() === 403
                => 'That code or link is invalid or has expired. Request a new one.',
            default => $fallback,
        };
    }

    /* ------------------------------------------------------------------ */
    /* Register (step 1: general info)                                     */
    /* ------------------------------------------------------------------ */

    public function showRegister()
    {
        return Inertia::render('Auth/Register');
    }

    public function register(Request $request)
    {
        $data = $request->validate([
            'first_name'  => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'last_name'   => ['required', 'string', 'max:255'],
            'email'       => $this->emailRules(),
            'password'   => $this->newPasswordRules(),
        ]);

        $email = $this->normalizeEmail($data['email']);

        try {
            $response = $this->supabase->signUp($email, $data['password'], [
                'first_name'  => trim($data['first_name']),
                'middle_name' => trim((string) ($data['middle_name'] ?? '')),
                'last_name'   => trim($data['last_name']),
            ]);
        } catch (ConnectionException) {
            Log::error('Supabase signup connection failed.');

            return back()->withErrors(['email' => self::UNAVAILABLE]);
        }

        if (!$response->successful()) {
            Log::warning('Supabase signup rejected.', ['status' => $response->status()]);

            throw ValidationException::withMessages([
                'email' => $this->errorMessage($response, 'Registration could not be completed. Check your details or try again later.'),
            ]);
        }

        // Email confirmation turned off in Supabase: we already have a session.
        if (Supabase::isSession($response)) {
            Supabase::storeSession($request, $response);

            return redirect()->route('setup');
        }

        $request->session()->put('pending_email', $email);

        return redirect()->route('register.verify')
            ->with('status', 'Check your USeP email for your verification code.');
    }

    /* ------------------------------------------------------------------ */
    /* Register (step 2: email verification)                               */
    /* ------------------------------------------------------------------ */

    public function showVerify(Request $request)
    {
        $email = $request->session()->get('pending_email');

        if (!is_string($email)) {
            return redirect()->route('register');
        }

        return Inertia::render('Auth/VerifyEmail', ['email' => $email]);
    }

    public function verify(Request $request)
    {
        $data  = $request->validate(['code' => ['required', 'digits_between:6,10']]);
        $email = $request->session()->get('pending_email');

        if (!is_string($email)) {
            return redirect()->route('register');
        }

        try {
            $response = $this->supabase->verifyCode($email, $data['code'], 'email');
        } catch (ConnectionException) {
            return back()->withErrors(['code' => self::UNAVAILABLE]);
        }

        if (!Supabase::isSession($response)) {
            throw ValidationException::withMessages([
                'code' => $this->errorMessage($response, 'That code is invalid or has expired.'),
            ]);
        }

        $request->session()->forget('pending_email');
        Supabase::storeSession($request, $response);

        return redirect()->route('setup')->with('success', 'Email verified! Finish setting up your account.');
    }

    public function resend(Request $request)
    {
        $email = $request->session()->get('pending_email');

        if (!is_string($email)) {
            return redirect()->route('register');
        }

        try {
            $response = $this->supabase->resendSignup($email);
        } catch (ConnectionException) {
            return back()->withErrors(['code' => self::UNAVAILABLE]);
        }

        if (!$response->successful()) {
            return back()->withErrors(['code' => $this->errorMessage($response, 'Could not resend the email. Try again later.')]);
        }

        return back()->with('status', 'A new code and link were sent to ' . $email . '.');
    }

    /**
     * Email links land here: /auth/confirm?token_hash=...&type=email|signup|recovery
     */
    public function confirmLink(Request $request)
    {
        $tokenHash = (string) $request->query('token_hash', '');
        $type      = (string) $request->query('type', 'email');

        if ($tokenHash === '' || !in_array($type, ['email', 'signup', 'recovery'], true)) {
            return redirect()->route('login')->withErrors(['email' => 'That link is invalid.']);
        }

        try {
            $response = $this->supabase->verifyTokenHash($tokenHash, $type === 'signup' ? 'email' : $type);
        } catch (ConnectionException) {
            return redirect()->route('login')->withErrors(['email' => self::UNAVAILABLE]);
        }

        if (!Supabase::isSession($response)) {
            $target = $type === 'recovery' ? 'password.request' : 'login';

            return redirect()->route($target)->withErrors([
                'email' => $this->errorMessage($response, 'That link is invalid or has expired.'),
            ]);
        }

        $request->session()->forget('pending_email');
        Supabase::storeSession($request, $response);

        if ($type === 'recovery') {
            $request->session()->put('password_reset_ready', true);

            return redirect()->route('password.reset');
        }

        return redirect()->route('setup')->with('success', 'Email verified! Finish setting up your account.');
    }

    /**
     * Supabase's default email links come back as /auth/callback#access_token=…&type=signup|recovery.
     * The page (Auth/Callback) posts the tokens here; we verify them with Supabase before trusting them.
     */
    public function showCallback()
    {
        return Inertia::render('Auth/Callback');
    }

    public function completeCallback(Request $request)
    {
        $data = $request->validate([
            'access_token'  => ['required', 'string', 'max:4096'],
            'refresh_token' => ['required', 'string', 'max:512'],
            'expires_in'    => ['nullable', 'integer', 'min:0', 'max:86400'],
            'type'          => ['nullable', 'string', 'in:signup,email,recovery,magiclink,invite,email_change'],
        ]);

        try {
            $user = $this->supabase->getUser($data['access_token']);
        } catch (ConnectionException) {
            return redirect()->route('login')->withErrors(['email' => self::UNAVAILABLE]);
        }

        $email = strtolower((string) $user->json('email'));

        if (!$user->successful() || !is_string($user->json('id')) || !preg_match('/^[^@\s]+@usep\.edu\.ph$/i', $email)) {
            return redirect()->route('login')->withErrors(['email' => 'That link is invalid or has expired.']);
        }

        $request->session()->regenerate();
        $request->session()->forget('pending_email');
        Supabase::storeTokens($request, $data['access_token'], $data['refresh_token'], (int) ($data['expires_in'] ?? 3600), (array) $user->json());

        if (($data['type'] ?? '') === 'recovery') {
            $request->session()->put('password_reset_ready', true);

            return redirect()->route('password.reset');
        }

        return redirect()->route('setup')->with('success', 'Email verified! Finish setting up your account.');
    }

    /* ------------------------------------------------------------------ */
    /* Login / logout                                                      */
    /* ------------------------------------------------------------------ */

    public function showLogin()
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => true,
            'status'           => session('status'),
        ]);
    }

    public function login(Request $request)
    {
        $data = $request->validate([
            'email'    => $this->emailRules(),
            'password' => ['required', 'string', 'max:128'],
        ]);

        $email = $this->normalizeEmail($data['email']);

        try {
            $response = $this->supabase->signInWithPassword($email, $data['password']);
        } catch (ConnectionException) {
            Log::error('Supabase login connection failed.');

            return back()->withErrors(['email' => self::UNAVAILABLE]);
        }

        if ($response->json('error_code') === 'email_not_confirmed') {
            $request->session()->put('pending_email', $email);

            return redirect()->route('register.verify')
                ->with('status', 'Please verify your email first. Use the code we sent, or resend it.');
        }

        if (!Supabase::isSession($response) || strtolower((string) $response->json('user.email')) !== $email) {
            Log::notice('Supabase login rejected.', ['status' => $response->status()]);

            throw ValidationException::withMessages([
                'email' => $response->status() === 429
                    ? 'Too many attempts. Please wait a minute and try again.'
                    : 'Invalid email or password.',
            ]);
        }

        Supabase::storeSession($request, $response);

        return redirect()->intended(route('dashboard'));
    }

    public function logout(Request $request)
    {
        $accessToken = $request->session()->get('supabase_access_token');

        try {
            if (is_string($accessToken) && $accessToken !== '') {
                $response = $this->supabase->signOut($accessToken);
                if (!$response->successful()) {
                    Log::warning('Supabase logout revocation failed.', ['status' => $response->status()]);
                }
            }
        } catch (ConnectionException) {
            Log::warning('Supabase logout connection failed.');
        } finally {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return redirect()->route('login')->with('status', 'You have been logged out.');
    }

    /* ------------------------------------------------------------------ */
    /* Forgot password                                                     */
    /* ------------------------------------------------------------------ */

    public function showForgot()
    {
        return Inertia::render('Auth/ForgotPassword', ['status' => session('status')]);
    }

    public function sendReset(Request $request)
    {
        $data  = $request->validate(['email' => $this->emailRules()]);
        $email = $this->normalizeEmail($data['email']);

        try {
            $response = $this->supabase->sendPasswordReset($email);
        } catch (ConnectionException) {
            return back()->withErrors(['email' => self::UNAVAILABLE]);
        }

        if ($response->status() === 429) {
            return back()->withErrors(['email' => 'Too many requests. Please wait a minute and try again.']);
        }

        // Same answer whether or not the account exists.
        $request->session()->put('reset_email', $email);
        $request->session()->forget('password_reset_ready');

        return redirect()->route('password.reset')
            ->with('status', 'If an account exists for that email, we sent a reset code and link.');
    }

    public function showReset(Request $request)
    {
        $ready = (bool) $request->session()->get('password_reset_ready')
            && is_string($request->session()->get('supabase_access_token'));

        return Inertia::render('Auth/ResetPassword', [
            'email' => $request->session()->get('reset_email', ''),
            'ready' => $ready,
        ]);
    }

    public function verifyResetCode(Request $request)
    {
        $data = $request->validate([
            'email' => $this->emailRules(),
            'code'  => ['required', 'digits_between:6,10'],
        ]);

        try {
            $response = $this->supabase->verifyCode($this->normalizeEmail($data['email']), $data['code'], 'recovery');
        } catch (ConnectionException) {
            return back()->withErrors(['code' => self::UNAVAILABLE]);
        }

        if (!Supabase::isSession($response)) {
            throw ValidationException::withMessages([
                'code' => $this->errorMessage($response, 'That code is invalid or has expired.'),
            ]);
        }

        Supabase::storeSession($request, $response);
        $request->session()->put('password_reset_ready', true);

        return redirect()->route('password.reset');
    }

    public function resetPassword(Request $request)
    {
        $data        = $request->validate(['password' => $this->newPasswordRules()]);
        $accessToken = $request->session()->get('supabase_access_token');

        if (!$request->session()->get('password_reset_ready') || !is_string($accessToken)) {
            return redirect()->route('password.request')
                ->withErrors(['email' => 'Your reset session expired. Request a new code.']);
        }

        try {
            $response = $this->supabase->updatePassword($accessToken, $data['password']);
        } catch (ConnectionException) {
            return back()->withErrors(['password' => self::UNAVAILABLE]);
        }

        if (!$response->successful()) {
            throw ValidationException::withMessages([
                'password' => $this->errorMessage($response, 'Could not update your password. Try a different one.'),
            ]);
        }

        $request->session()->forget(['password_reset_ready', 'reset_email']);

        return redirect()->route('dashboard')->with('success', 'Your password has been changed.');
    }
}
