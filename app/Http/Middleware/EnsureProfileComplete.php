<?php

namespace App\Http\Middleware;

use App\Models\UserInfo;
use App\Services\Supabase;
use App\Support\CurrentProfile;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** Logged-in users without a user_info row must finish account setup first. */
class EnsureProfileComplete
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!CurrentProfile::get($request) && self::isArchived($request)) {
            return self::rejectArchived($request);
        }

        if (!CurrentProfile::get($request)) {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Finish setting up your account first.'], 403);
            }

            return redirect()->route('setup');
        }

        return $next($request);
    }

    public static function isArchived(Request $request): bool
    {
        $userId = $request->session()->get('supabase_user_id');

        return is_string($userId) && UserInfo::withArchived()->where('user_id', $userId)->whereNotNull('archived_at')->exists();
    }

    /** Archived users (e.g. last school year's cadets) are logged out. */
    public static function rejectArchived(Request $request): Response
    {
        Supabase::clearSession($request);
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        $message = 'Your account has been archived (your school year has ended). Contact an ROTC officer if this is a mistake.';

        if ($request->expectsJson()) {
            return response()->json(['message' => $message], 403);
        }

        return redirect()->route('login')->withErrors(['email' => $message]);
    }
}
