<?php

namespace App\Http\Middleware;

use App\Models\UserInfo;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $this->supabaseUser($request),
            ],
        ];
    }

    /**
     * Build the authenticated user from the Supabase session.
     *
     * Laravel's own guard is not used, so $request->user() is null.
     * The Supabase identity lives in the session; the matching
     * user_info row (if any) supplies the display name.
     */
    private function supabaseUser(Request $request): ?array
    {
        $userId = $request->session()->get('supabase_user_id');
        $email = (string) $request->session()->get('supabase_email', '');

        if (! is_string($userId) || $userId === '') {
            return null;
        }

        $profile = UserInfo::where('user_id', $userId)->first();

        $name = $profile
            ? trim($profile->first_name.' '.$profile->last_name)
            : Str::before($email, '@');

        return [
            'id' => $userId,
            'name' => $name !== '' ? $name : $email,
            'email' => $email,
            'is_system_admin' => (bool) ($profile?->is_system_admin),
        ];
    }
}
