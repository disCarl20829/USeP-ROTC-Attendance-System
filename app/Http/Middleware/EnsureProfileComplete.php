<?php

namespace App\Http\Middleware;

use App\Support\CurrentProfile;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** Logged-in users without a user_info row must finish account setup first. */
class EnsureProfileComplete
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!CurrentProfile::get($request)) {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Finish setting up your account first.'], 403);
            }

            return redirect()->route('setup');
        }

        return $next($request);
    }
}
