<?php

namespace App\Http\Middleware;

use App\Support\CurrentProfile;
use App\Support\Permissions;
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
                'user' => fn () => $this->sharedUser($request),
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error'   => fn () => $request->session()->get('error'),
                'status'  => fn () => $request->session()->get('status'),
            ],
        ];
    }

    private function sharedUser(Request $request): ?array
    {
        $userId = $request->session()->get('supabase_user_id');
        if (!is_string($userId) || $userId === '') {
            return null;
        }

        $email   = (string) $request->session()->get('supabase_email', '');
        $profile = CurrentProfile::get($request);
        $role    = Permissions::roleOf($profile);

        return [
            'id'          => $userId,
            'email'       => $email,
            'name'        => $profile?->full_name ?: Str::before($email, '@'),
            'role'        => $role ?: null,
            'has_profile' => (bool) $profile,
            'status'      => $profile ? strtolower((string) $profile->status) : null,
            'can'         => Permissions::all($profile),
        ];
    }
}
