<?php

namespace App\Support;

use App\Models\UserInfo;
use Illuminate\Http\Request;

/**
 * Resolves the logged-in user's user_info row (once per request).
 * Matches ONLY on the verified Supabase user id.
 */
class CurrentProfile
{
    public static function get(Request $request): ?UserInfo
    {
        if ($request->attributes->has('rotc_profile')) {
            return $request->attributes->get('rotc_profile');
        }

        $userId  = $request->session()->get('supabase_user_id');
        $profile = is_string($userId) && $userId !== ''
            ? UserInfo::with(['role', 'campus', 'course', 'platoon', 'specialization'])
                ->where('user_id', $userId)
                ->first()
            : null;

        $request->attributes->set('rotc_profile', $profile);

        return $profile;
    }

    public static function forget(Request $request): void
    {
        $request->attributes->remove('rotc_profile');
    }
}
