<?php

namespace App\Http\Middleware;

use App\Services\Supabase;
use Closure;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Requires a Supabase session. The access token lives ~1 hour; when it is about
 * to expire it is renewed with the refresh token, so users stay logged in.
 */
class SupabaseAuth
{
    /** Renew this many seconds before the token actually expires. */
    private const RENEW_MARGIN = 60;

    public function __construct(private Supabase $supabase)
    {
    }

    public function handle(Request $request, Closure $next): Response
    {
        $session      = $request->session();
        $accessToken  = $session->get('supabase_access_token');
        $refreshToken = $session->get('supabase_refresh_token');
        $userId       = $session->get('supabase_user_id');
        $expiresAt    = $session->get('supabase_token_expires_at');

        if (!is_string($accessToken) || $accessToken === '' || !is_string($userId) || $userId === '') {
            return $this->unauthenticated($request);
        }

        if (!is_numeric($expiresAt) || (int) $expiresAt - self::RENEW_MARGIN <= time()) {
            if (!is_string($refreshToken) || $refreshToken === '' || !$this->renew($request, $refreshToken, $userId)) {
                return $this->unauthenticated($request);
            }
        }

        return $next($request);
    }

    private function renew(Request $request, string $refreshToken, string $userId): bool
    {
        try {
            $response = $this->supabase->refresh($refreshToken);
        } catch (ConnectionException) {
            Log::warning('Supabase token refresh connection failed.');

            return false;
        }

        if (!Supabase::isSession($response) || $response->json('user.id') !== $userId) {
            Log::notice('Supabase token refresh rejected.', ['status' => $response->status()]);

            return false;
        }

        Supabase::storeSession($request, $response, regenerate: false);

        return true;
    }

    private function unauthenticated(Request $request): Response
    {
        Supabase::clearSession($request);

        if ($request->expectsJson()) {
            return response()->json(['message' => 'Your session has expired. Please log in again.'], 401);
        }

        return redirect()->guest(route('login'))
            ->with('status', 'Your session has expired. Please log in again.');
    }
}
