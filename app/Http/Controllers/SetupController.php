<?php

namespace App\Http\Controllers;

use App\Http\Middleware\EnsureProfileComplete;
use App\Models\SchoolYear;
use App\Models\UserInfo;
use App\Support\Enrollment;
use App\Support\CurrentProfile;
use App\Support\LookupOptions;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

/**
 * Register step 3: technical info (student ID, campus, course, platoon, specialization).
 * Role is always Cadet. Creates the profile + QR token, then goes to the dashboard.
 * If an officer already added this cadet by hand (same email), that profile is linked.
 */
class SetupController extends Controller
{
    public function show(Request $request)
    {
        if (CurrentProfile::get($request)) {
            return redirect()->route('dashboard');
        }

        if (EnsureProfileComplete::isArchived($request)) {
            return EnsureProfileComplete::rejectArchived($request);
        }

        $email    = (string) $request->session()->get('supabase_email');
        $meta     = (array) $request->session()->get('supabase_user_meta', []);
        $existing = $this->linkableProfile($request, $email);

        return Inertia::render('Auth/Setup', [
            'email'    => $email,
            'prefill'  => [
                'first_name'        => $existing?->first_name ?? ($meta['first_name'] ?? ''),
                'middle_name'       => $existing?->middle_name ?? ($meta['middle_name'] ?? ''),
                'last_name'         => $existing?->last_name ?? ($meta['last_name'] ?? ''),
                'student_id'        => $existing?->student_id ?? '',
                'campus_id'         => $existing?->campus_id,
                'course_id'         => $existing?->course_id,
                'platoon_id'        => $existing?->platoon_id,
                'specialization_id' => $existing?->specialization_id,
            ],
            'linked'   => (bool) $existing,
            'schoolYear' => SchoolYear::active()?->toArrayForUi(),
            'options'  => LookupOptions::all(),
        ]);
    }

    public function store(Request $request)
    {
        if (CurrentProfile::get($request)) {
            return redirect()->route('dashboard');
        }

        if (EnsureProfileComplete::isArchived($request)) {
            return EnsureProfileComplete::rejectArchived($request);
        }

        $userId   = (string) $request->session()->get('supabase_user_id');
        $email    = (string) $request->session()->get('supabase_email');
        $existing = $this->linkableProfile($request, $email);

        // Self-registration is for first years only. Officers vetted hand-added cadets already.
        $studentIdRules = LookupOptions::studentIdRules($existing?->info_id);
        if (!$existing) {
            $studentIdRules[] = Enrollment::rule($email);
        }

        $data = $request->validate([
            'first_name'        => ['required', 'string', 'max:255'],
            'middle_name'       => ['nullable', 'string', 'max:255'],
            'last_name'         => ['required', 'string', 'max:255'],
            'student_id'        => $studentIdRules,
            ...LookupOptions::campusCourseRules($request->integer('campus_id') ?: null),
            'platoon_id'        => ['required', 'integer', 'exists:platoon_list,platoon_id'],
            'specialization_id' => ['required', 'integer', 'exists:specialization_list,specialization_id'],
        ]);

        $cadetRoleId = LookupOptions::roleId(config('rotc.default_role'));
        if (!$cadetRoleId) {
            throw ValidationException::withMessages(['student_id' => 'The Cadet role is missing in role_list. Contact an admin.']);
        }

        $profile = DB::transaction(function () use ($existing, $data, $userId, $email, $cadetRoleId) {
            $profile = $existing ?? new UserInfo([
                'role_id'        => $cadetRoleId,
                'status'         => 'active',
                'school_year_id' => SchoolYear::active()?->school_year_id,
            ]);

            // Linking a hand-added profile: user_id changes, records follow (ON UPDATE CASCADE).
            $profile->user_id           = $userId;
            $profile->email             = $email;
            $profile->first_name        = trim($data['first_name']);
            $profile->middle_name       = trim((string) ($data['middle_name'] ?? '')) ?: null;
            $profile->last_name         = trim($data['last_name']);
            $profile->student_id        = trim($data['student_id']);
            $profile->campus_id         = $data['campus_id'];
            $profile->course_id         = $data['course_id'];
            $profile->platoon_id        = $data['platoon_id'];
            $profile->specialization_id = $data['specialization_id'];
            $profile->save();

            $profile->ensureQrToken();

            return $profile;
        });

        CurrentProfile::forget($request);

        return redirect()->route('dashboard')
            ->with('success', "Welcome, {$profile->first_name}! Your account and QR code are ready.");
    }

    /** A hand-added profile with this email that is not yet linked to a login. */
    private function linkableProfile(Request $request, string $email): ?UserInfo
    {
        if ($email === '') {
            return null;
        }

        $profile = UserInfo::findByEmail($email);

        if (!$profile || $profile->archived_at) {
            return null;
        }

        $linkedToLogin = DB::table('auth.users')->where('id', $profile->user_id)->exists();

        return $linkedToLogin ? null : $profile;
    }
}
