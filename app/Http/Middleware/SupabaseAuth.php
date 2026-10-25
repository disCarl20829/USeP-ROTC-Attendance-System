<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SupabaseAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        $accessToken = $request->session()->get('supabase_access_token');
        $userId = $request->session()->get('supabase_user_id');
        $expiresAt = $request->session()->get('supabase_token_expires_at');

        if (
            ! is_string($accessToken) ||
            $accessToken === '' ||
            ! is_string($userId) ||
            $userId === '' ||
            ! is_numeric($expiresAt) ||
            (int) $expiresAt <= time()
        ) {
            $request->session()->forget([
                'supabase_access_token',
                'supabase_refresh_token',
                'supabase_user_id',
                'supabase_email',
                'supabase_token_expires_at',
                'supabase_expires_at',
            ]);

            return redirect()->guest(route('login'));
        }

        return $next($request);
    }
}