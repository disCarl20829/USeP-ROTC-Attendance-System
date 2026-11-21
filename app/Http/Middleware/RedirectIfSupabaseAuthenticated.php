<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** Guest-only pages (login, register, forgot password). */
class RedirectIfSupabaseAuthenticated
{
    public function handle(Request $request, Closure $next): Response
    {
        if (is_string($request->session()->get('supabase_access_token'))) {
            return redirect()->route('dashboard');
        }

        return $next($request);
    }
}
