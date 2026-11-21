<?php

namespace App\Http\Middleware;

use App\Support\CurrentProfile;
use App\Support\Permissions;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Usage: ->middleware('permission:scan') — see config/rotc.php.
 * Denies by default: no profile, unknown role or unknown permission => 403.
 */
class EnsurePermission
{
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        if (Permissions::allows(CurrentProfile::get($request), $permission)) {
            return $next($request);
        }

        if ($request->expectsJson()) {
            return response()->json(['message' => 'You do not have permission to do that.'], 403);
        }

        return redirect()->route('dashboard')->with('error', 'You do not have permission to open that page.');
    }
}
