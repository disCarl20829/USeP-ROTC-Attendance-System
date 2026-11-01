<?php

namespace App\Http\Controllers;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Response;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Throwable;

class AuthController extends Controller
{
    private function supabase()
    {
        $url = rtrim(
            (string) config('services.supabase.url'),
            '/'
        );

        $key = (string) config('services.supabase.key');

        if ($url === '' || $key === '') {
            throw new \RuntimeException(
                'Supabase authentication is not configured.'
            );
        }

        return Http::baseUrl($url)
            ->acceptJson()
            ->asJson()
            ->withHeaders([
                'apikey' => $key,
            ])
            ->connectTimeout(5)
            ->timeout(15);
    }

    private function emailRules(): array
    {
        return [
            'required',
            'string',
            'email:rfc',
            'max:254',
            'regex:/^[^@\s]+@usep\.edu\.ph$/i',
        ];
    }

    private function apiFailed(Response $response): bool
    {
        return !$response->successful();
    }

    /**
     * Register an account through Supabase Auth.
     * Does not create a Laravel users-table account.
     */
    public function register(Request $request)
    {
        $data = $request->validate([
            'email' => $this->emailRules(),
            'password' => [
                'required',
                'string',
                'min:12',
                'max:128',
            ],
        ]);

        try {
            $response = $this->supabase()->post(
                '/auth/v1/signup',
                [
                    'email' => strtolower(trim($data['email'])),
                    'password' => $data['password'],
                ]
            );

            if ($this->apiFailed($response)) {
                // Log status only. Never log passwords or tokens.
                Log::warning('Supabase signup rejected.', [
                    'status' => $response->status(),
                ]);

                throw ValidationException::withMessages([
                    'email' => 'Registration could not be completed. Check your details or try again later.',
                ]);
            }

            // Do not automatically authenticate here.
            // Supabase may require email confirmation.
            return redirect()
                ->route('login')
                ->with(
                    'status',
                    'Registration submitted. Check your USeP email for a confirmation link if required.'
                );
        } catch (ConnectionException $e) {
            Log::error('Supabase signup connection failed.');

            return back()
                ->withInput($request->only('email'))
                ->withErrors([
                    'email' => 'The authentication service is temporarily unavailable. Please try again.',
                ]);
        }
    }

    /**
     * Authenticate through Supabase Auth.
     */
    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => $this->emailRules(),
            'password' => [
                'required',
                'string',
                'max:128',
            ],
        ]);

        try {
            $response = $this->supabase()->post(
                '/auth/v1/token?grant_type=password',
                [
                    'email' => strtolower(trim($data['email'])),
                    'password' => $data['password'],
                ]
            );

            if (
                !$response->successful()
                || !is_string($response->json('access_token'))
                || !is_string($response->json('refresh_token'))
                || !is_string($response->json('user.id'))
            ) {
                Log::notice('Supabase login rejected.', [
                    'status' => $response->status(),
                ]);

                throw ValidationException::withMessages([
                    'email' => 'Invalid credentials, unconfirmed email, or account unavailable.',
                ]);
            }

            $accessToken = $response->json('access_token');
            $refreshToken = $response->json('refresh_token');

            // Independently ask Supabase to verify the access token
            // and return the authenticated identity.
            $identityResponse = $this->supabase()
                ->withToken($accessToken)
                ->get('/auth/v1/user');

            if (
                !$identityResponse->successful()
                || !is_string($identityResponse->json('id'))
                || $identityResponse->json('id')
                    !== $response->json('user.id')
                || strtolower((string) $identityResponse->json('email'))
                    !== strtolower(trim($data['email']))
            ) {
                Log::warning('Supabase identity verification failed.');

                throw ValidationException::withMessages([
                    'email' => 'Unable to verify your account. Please try again.',
                ]);
            }

            // Enforce the domain against the verified identity too.
            $verifiedEmail = (string) $identityResponse->json('email');

            if (!preg_match(
                '/^[^@\s]+@usep\.edu\.ph$/i',
                $verifiedEmail
            )) {
                throw ValidationException::withMessages([
                    'email' => 'Only USeP institutional email addresses are allowed.',
                ]);
            }

            // Rotate the session ID to mitigate session fixation.
            $request->session()->regenerate();

            $request->session()->put([
                'supabase_access_token' => $accessToken,
                'supabase_refresh_token' => $refreshToken,
                'supabase_user_id' => $identityResponse->json('id'),
                'supabase_email' => $verifiedEmail,
                'supabase_token_expires_at' => now()->addSeconds(
                    max(0, (int) $response->json('expires_in', 3600))
                )->timestamp,
            ]);

            // Do not trust user roles supplied by the browser.
            // Retrieve authorized role/permission data server-side.

            return redirect()->intended('/dashboard');
        } catch (ConnectionException $e) {
            Log::error('Supabase login connection failed.');

            return back()
                ->withInput($request->only('email'))
                ->withErrors([
                    'email' => 'The authentication service is temporarily unavailable. Please try again.',
                ]);
        }
    }

    /**
     * Revoke the Supabase session and invalidate the Laravel session.
     */
    public function logout(Request $request)
    {
        $accessToken = $request->session()->get(
            'supabase_access_token'
        );

        try {
            if (is_string($accessToken) && $accessToken !== '') {
                $response = $this->supabase()
                    ->withToken($accessToken)
                    ->post('/auth/v1/logout');

                if (!$response->successful()) {
                    Log::warning('Supabase logout revocation failed.', [
                        'status' => $response->status(),
                    ]);
                }
            }
        } catch (ConnectionException $e) {
            // Still invalidate the local session if Supabase is unavailable.
            Log::warning('Supabase logout connection failed.');
        } finally {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return redirect()
            ->route('login')
            ->with('status', 'You have been logged out.');
    }
}
