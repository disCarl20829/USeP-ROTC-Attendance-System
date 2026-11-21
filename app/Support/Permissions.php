<?php

namespace App\Support;

use App\Models\UserInfo;

class Permissions
{
    public static function roleOf(?UserInfo $profile): string
    {
        return strtolower(trim((string) $profile?->role?->role_name));
    }

    public static function allows(?UserInfo $profile, string $permission): bool
    {
        if (!$profile) {
            return false;
        }

        $role = self::roleOf($profile);

        if ($role === 'admin') {
            return true;
        }

        // Read the whole map: permission names contain dots, which config() would
        // otherwise treat as nested keys.
        $allowed = config('rotc.permissions', [])[$permission] ?? null;

        if (!is_array($allowed)) {
            return false; // unknown permission: deny
        }

        return in_array($role, array_map('strtolower', $allowed), true);
    }

    /** Map of every permission => bool, shared with the frontend. */
    public static function all(?UserInfo $profile): array
    {
        $map = [];
        foreach (array_keys(config('rotc.permissions', [])) as $permission) {
            $map[$permission] = self::allows($profile, $permission);
        }

        return $map;
    }

    public static function points(?string $status): int
    {
        return (int) (config('rotc.points')[strtolower((string) $status)] ?? 0);
    }
}
