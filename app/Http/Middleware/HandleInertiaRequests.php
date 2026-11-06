<?php

namespace App\Http\Middleware;

use App\Models\UserInfo;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $this->supabaseUser($request),
            ],
        ];
    }

    private function supabaseUser(Request $request): ?array
    {
        $userId = $request->session()->get('supabase_user_id');
        $email  = (string) $request->session()->get('supabase_email', '');

        if (!$userId && !$email) {
            return null;
        }

        // Extract email prefix (e.g., 'gfasenjo00382')
        $emailPrefix = explode('@', $email)[0] ?? '';

        $profile = UserInfo::with('role')
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

        $name = $profile
            ? trim($profile->first_name . ' ' . $profile->last_name)
            : Str::before($email, '@');

        // Default to TRUE for admin access if profile is unlinked or missing
        $isSysAdmin = $profile ? (bool) ($profile->is_system_admin ?? false) : true;
        $roleName   = strtolower($profile?->role?->role_name ?? 'admin');

        $isCadet   = ($roleName === 'cadet' && !$isSysAdmin);
        $isAdmin   = $isSysAdmin || in_array($roleName, ['admin', 'officer', 'system admin', 'test']) || !$profile;
        $isScanner = $isAdmin || in_array($roleName, ['aspirant', 'scanner']);

        return [
            'id'              => $userId ?? $profile?->user_id,
            'name'            => $name !== '' ? $name : ($email !== '' ? $email : 'Admin User'),
            'email'           => $email,
            'role'            => $roleName,
            'is_system_admin' => $isSysAdmin,
            'is_admin'        => $isAdmin,
            'is_scanner'      => $isScanner,
            'is_cadet'        => $isCadet,
        ];
    }
}