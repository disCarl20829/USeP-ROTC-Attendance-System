<?php

namespace App\Http\Middleware;

use App\Models\UserInfo;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $userId = $request->session()->get('supabase_user_id');
        $email = (string) $request->session()->get('supabase_email', '');

        if (!is_string($userId) || $userId === '') {
            return redirect()->route('login');
        }

        $userInfo = UserInfo::with('role')
            ->where('user_id', $userId)
            ->orWhere('email', $email)
            ->first();

        // Allow system admins to bypass role restrictions
        if ($userInfo?->is_system_admin) {
            return $next($request);
        }

        $userRole = strtolower($userInfo?->role?->role_name ?? 'cadet');

        // Check if user role matches allowed roles for the route
        if (!in_array($userRole, array_map('strtolower', $roles))) {
            // Redirect Cadets trying to access Admin/Scanner pages back to Cadet Portal
            if ($userRole === 'cadet') {
                return redirect()->route('cadet.portal')->with('error', 'Unauthorized access.');
            }

            abort(403, 'Unauthorized access area.');
        }

        return $next($request);
    }
}