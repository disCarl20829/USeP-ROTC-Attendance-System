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
        $email = (string) $request->session()->get('supabase_email', '');

        if (! is_string($userId) || $userId === '') {
            return null;
        }

        $profile = UserInfo::with('role')
            ->where('user_id', $userId)
            ->orWhere('email', $email)
            ->first();

        $name = $profile
            ? trim($profile->first_name.' '.$profile->last_name)
            : Str::before($email, '@');

        $roleName  = strtolower($profile?->role?->role_name ?? 'cadet');
        $isAdmin   = (bool) ($profile?->is_system_admin || in_array($roleName, ['admin', 'officer']));
        $isScanner = (bool) ($isAdmin || in_array($roleName, ['aspirant', 'scanner']));
        $isCadet   = (bool) ($roleName === 'cadet' && !$isAdmin);

        return [
            'id'              => $userId,
            'name'            => $name !== '' ? $name : $email,
            'email'           => $email,
            'role'            => $roleName,
            'is_system_admin' => (bool) ($profile?->is_system_admin),
            'is_admin'        => $isAdmin,
            'is_scanner'      => $isScanner,
            'is_cadet'        => $isCadet,
        ];
    }
}