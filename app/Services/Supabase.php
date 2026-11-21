<?php

namespace App\Services;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

/**
 * Thin wrapper around the Supabase Auth (GoTrue) REST API.
 * Never log passwords, codes or tokens.
 */
class Supabase
{
    public const SESSION_KEYS = [
        'supabase_access_token',
        'supabase_refresh_token',
        'supabase_user_id',
        'supabase_email',
        'supabase_token_expires_at',
        'supabase_user_meta',
    ];

    public function client(): PendingRequest
    {
        $url = rtrim((string) config('services.supabase.url'), '/');
        $key = (string) config('services.supabase.key');

        if ($url === '' || $key === '') {
            throw new \RuntimeException('Supabase authentication is not configured.');
        }

        return Http::baseUrl($url)
            ->acceptJson()
            ->asJson()
            ->withHeaders(['apikey' => $key])
            ->connectTimeout(5)
            ->timeout(15);
    }

    public function signUp(string $email, string $password, array $meta): Response
    {
        return $this->client()->post('/auth/v1/signup', [
            'email'    => $email,
            'password' => $password,
            'data'     => $meta,
        ]);
    }

    public function signInWithPassword(string $email, string $password): Response
    {
        return $this->client()->post('/auth/v1/token?grant_type=password', [
            'email'    => $email,
            'password' => $password,
        ]);
    }

    public function refresh(string $refreshToken): Response
    {
        return $this->client()->post('/auth/v1/token?grant_type=refresh_token', [
            'refresh_token' => $refreshToken,
        ]);
    }

    /** Verify a 6-digit code sent by email. $type: email (sign-up) | recovery */
    public function verifyCode(string $email, string $code, string $type): Response
    {
        return $this->client()->post('/auth/v1/verify', [
            'type'  => $type,
            'email' => $email,
            'token' => $code,
        ]);
    }

    /** Verify the token_hash from an email link. */
    public function verifyTokenHash(string $tokenHash, string $type): Response
    {
        return $this->client()->post('/auth/v1/verify', [
            'type'       => $type,
            'token_hash' => $tokenHash,
        ]);
    }

    public function resendSignup(string $email): Response
    {
        return $this->client()->post('/auth/v1/resend', [
            'type'  => 'signup',
            'email' => $email,
        ]);
    }

    public function sendPasswordReset(string $email): Response
    {
        return $this->client()->post('/auth/v1/recover', ['email' => $email]);
    }

    public function updatePassword(string $accessToken, string $password): Response
    {
        return $this->client()->withToken($accessToken)->put('/auth/v1/user', [
            'password' => $password,
        ]);
    }

    public function getUser(string $accessToken): Response
    {
        return $this->client()->withToken($accessToken)->get('/auth/v1/user');
    }

    public function signOut(string $accessToken): Response
    {
        return $this->client()->withToken($accessToken)->post('/auth/v1/logout');
    }

    /** True when the response is a valid Supabase session. */
    public static function isSession(Response $response): bool
    {
        return $response->successful()
            && is_string($response->json('access_token'))
            && is_string($response->json('refresh_token'))
            && is_string($response->json('user.id'));
    }

    /** Store a Supabase session (from login, verify or refresh) in the Laravel session. */
    public static function storeSession(Request $request, Response $response, bool $regenerate = true): void
    {
        if ($regenerate) {
            // Mitigate session fixation.
            $request->session()->regenerate();
        }

        $request->session()->put([
            'supabase_access_token'     => $response->json('access_token'),
            'supabase_refresh_token'    => $response->json('refresh_token'),
            'supabase_user_id'          => $response->json('user.id'),
            'supabase_email'            => strtolower((string) $response->json('user.email')),
            'supabase_user_meta'        => (array) $response->json('user.user_metadata', []),
            'supabase_token_expires_at' => now()->addSeconds(
                max(0, (int) $response->json('expires_in', 3600))
            )->timestamp,
        ]);
    }

    public static function clearSession(Request $request): void
    {
        $request->session()->forget([...self::SESSION_KEYS, 'supabase_expires_at']);
    }
}
