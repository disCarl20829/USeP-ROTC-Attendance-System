<?php

namespace App\Http\Controllers;

use App\Models\Specialization;
use App\Models\Utility;
use App\Support\CurrentProfile;
use App\Support\Enrollment;
use App\Support\LookupOptions;
use App\Support\Permissions;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SettingsController extends Controller
{
    public function index(Request $request)
    {
        $profile = CurrentProfile::get($request);

        return Inertia::render('Settings', [
            'profile' => $profile->toProfileArray(),
            'utility' => $this->utility(),
            'options' => LookupOptions::all(),
            'platoonAdmin' => Permissions::allows($profile, 'platoons.manage')
                ? PlatoonUnitController::settingsProps()
                : null,
            'schoolYears' => Permissions::allows($profile, 'school_year.manage')
                ? SchoolYearController::settingsProps($request)
                : null,
            'can'     => [
                'system' => Permissions::allows($profile, 'settings.system'),
                'assign' => self::canChangeOwnPlatoon($profile),
            ],
        ]);
    }

    private static function canChangeOwnPlatoon($profile): bool
    {
        return (bool) config('rotc.self_assign_platoon') || Permissions::allows($profile, 'cadets.assign');
    }

    /** Own profile, including platoon / specialization (see rotc.self_assign_platoon). */
    public function updateProfile(Request $request)
    {
        $profile   = CurrentProfile::get($request);
        $canAssign = self::canChangeOwnPlatoon($profile);

        // Cadets/aspirants changing their own student ID must stay within the rules.
        $studentIdRules = LookupOptions::studentIdRules($profile->info_id);
        $isTrainee      = in_array(Permissions::roleOf($profile), config('rotc.attendance_roles'), true);
        if ($isTrainee && trim((string) $request->input('student_id')) !== (string) $profile->student_id
            && !Permissions::allows($profile, 'cadets.manage')) {
            $studentIdRules[] = Enrollment::rule((string) $profile->email);
        }

        $data = $request->validate([
            'first_name'  => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'last_name'   => ['required', 'string', 'max:255'],
            'student_id' => $studentIdRules,
            ...LookupOptions::campusCourseRules($request->integer('campus_id') ?: null),
            ...($canAssign ? [
                'platoon_id'        => ['nullable', 'integer', 'exists:platoon_list,platoon_id'],
                'platoon_unit_id'   => LookupOptions::platoonUnitRules($request->integer('platoon_id') ?: null),
                'specialization_id' => ['nullable', 'integer', 'exists:specialization_list,specialization_id'],
            ] : []),
        ]);

        $profile->fill([
            'first_name'  => trim($data['first_name']),
            'middle_name' => trim((string) ($data['middle_name'] ?? '')) ?: null,
            'last_name'   => trim($data['last_name']),
            'student_id'  => trim($data['student_id']),
            'campus_id'  => $data['campus_id'],
            'course_id'  => $data['course_id'],
        ]);

        if ($canAssign) {
            $profile->platoon_id        = $data['platoon_id'] ?? null;
            $profile->platoon_unit_id   = !empty($data['platoon_id']) ? ($data['platoon_unit_id'] ?? null) : null;
            $profile->specialization_id = $data['specialization_id'] ?? Specialization::defaultId();
        }

        $profile->save();

        return back()->with('success', 'Profile updated.');
    }

    /** App-wide default session times (admin). */
    public function updateSystem(Request $request)
    {
        $data = $request->validate([
            'default_start_time' => ['required', 'date_format:H:i'],
            'default_end_time'   => ['required', 'date_format:H:i', 'after:default_start_time'],
            'default_late_time'  => ['required', 'date_format:H:i', 'after_or_equal:default_start_time', 'before_or_equal:default_end_time'],
            'welcome_video_url'  => [
                'nullable', 'string', 'max:500',
                fn ($a, $v, $fail) => $v && !\App\Support\YouTube::videoId($v) ? $fail('Paste a YouTube link, e.g. https://www.youtube.com/watch?v=…') : null,
            ],
        ]);

        $utility = Utility::firstOrNew(['id' => 1]);
        $utility->fill([
            ...$data,
            'updated_by' => $request->session()->get('supabase_user_id'),
        ]);
        $utility->save();

        return back()->with('success', 'Default times updated.');
    }

    private function utility(): array
    {
        $u = Utility::find(1);

        return [
            'default_start_time' => substr((string) ($u->default_start_time ?? '08:00'), 0, 5),
            'default_end_time'   => substr((string) ($u->default_end_time ?? '17:00'), 0, 5),
            'default_late_time'  => substr((string) ($u->default_late_time ?? '08:15'), 0, 5),
            'welcome_video_url'  => (string) ($u->welcome_video_url ?? ''),
        ];
    }
}
