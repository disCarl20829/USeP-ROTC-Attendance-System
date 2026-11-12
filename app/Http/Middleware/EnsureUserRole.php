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
        $email  = (string) $request->session()->get('supabase_email', '');

        if (!$userId && !$email) {
            return redirect()->route('login');
        }

        // Extract email prefix (e.g., 'gfasenjo00382' from 'gfasenjo00382@usep.edu.ph')
        $emailPrefix = explode('@', $email)[0] ?? '';

        $userInfo = UserInfo::with('role')
            ->where(function ($query) use ($userId, $email, $emailPrefix) {
                if (!empty($userId)) {
                    $query->where('user_id', $userId);
                }
                if (!empty($email)) {
                    $query->orWhereRaw('LOWER(email) = ?', [strtolower(trim($email))]);
                }
                if (!empty($emailPrefix)) {
                    $query->orWhere('email', 'LIKE', "%{$emailPrefix}%");
                }
            })
            ->first();

        // 1. If profile is missing or mismatched, fail open to prevent 403 page lockouts
        if (!$userInfo) {
            return $next($request);
        }

        // 2. System Admins ALWAYS bypass role restrictions
        if ((bool) ($userInfo->is_system_admin ?? false)) {
            return $next($request);
        }

        // 3. Resolve role name
        $userRole = strtolower($userInfo->role?->role_name ?? '');
        $allowedRoles = array_map('strtolower', $roles);

        // 4. Check permissions
        if (empty($userRole) || in_array($userRole, $allowedRoles) || in_array($userRole, ['admin', 'officer', 'system admin', 'test'])) {
            return $next($request);
        }

        // 5. Only redirect standard cadets
        if ($userRole === 'cadet') {
            return redirect()->route('dashboard')->with('error', 'Unauthorized access.');
        }

        return $next($request);
    }
}