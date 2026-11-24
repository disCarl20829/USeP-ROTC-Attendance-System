<?php

namespace App\Support;

use App\Models\Campus;
use App\Models\Course;
use App\Models\Platoon;
use App\Models\PlatoonUnit;
use App\Models\Role;
use App\Models\Specialization;

/** Dropdown options shared by Setup, Settings and Cadets pages. */
class LookupOptions
{
    public static function all(): array
    {
        return [
            'campuses' => Campus::orderBy('campus_name')->get(['campus_id', 'campus_name']),
            'courses'  => Course::orderBy('course_name')->get(['course_id', 'course_name', 'campus_name'])
                ->map(fn ($c) => [
                    'course_id'   => $c->course_id,
                    'course_name' => $c->course_name,
                    'campus_id'   => $c->campus_name, // column holds the campus id
                ]),
            'platoons'        => Platoon::orderBy('platoon_name')->get(['platoon_id', 'platoon_name']),
            'platoonUnits'    => PlatoonUnit::orderBy('platoon_id')->orderBy('number')->get(['unit_id', 'platoon_id', 'number'])
                ->map(fn ($u) => [
                    'unit_id'    => $u->unit_id,
                    'platoon_id' => $u->platoon_id,
                    'number'     => $u->number,
                    'label'      => PlatoonUnit::ordinal($u->number),
                ]),
            'specializations' => Specialization::orderBy('specialization_name')->get(['specialization_id', 'specialization_name']),
            'roles'           => Role::orderBy('role_id')->get(['role_id', 'role_name']),
        ];
    }

    /** Validation rules for campus + course (course must belong to campus). */
    public static function campusCourseRules(?int $campusId): array
    {
        return [
            'campus_id' => ['required', 'integer', 'exists:campus_list,campus_id'],
            'course_id' => [
                'required', 'integer',
                function ($attribute, $value, $fail) use ($campusId) {
                    $course = Course::find($value);
                    if (!$course) {
                        $fail('Choose a valid course.');
                    } elseif ($campusId && $course->campus_name && (int) $course->campus_name !== $campusId) {
                        $fail('That course is not offered on the selected campus.');
                    }
                },
            ],
        ];
    }

    public static function studentIdRules(?int $ignoreInfoId = null): array
    {
        return [
            'required', 'string', 'max:50', 'regex:/^[A-Za-z0-9\-]+$/',
            function ($attribute, $value, $fail) use ($ignoreInfoId) {
                $existing = \App\Models\UserInfo::findByStudentId((string) $value);
                if ($existing && $existing->info_id !== $ignoreInfoId) {
                    $fail('That student ID is already registered.');
                }
            },
        ];
    }

    /**
     * platoon_unit_id rules: must belong to the chosen platoon; required when that
     * platoon has numbers set up. $required = false allows leaving both empty.
     */
    public static function platoonUnitRules(?int $platoonId, bool $required = true): array
    {
        $hasUnits = $platoonId && PlatoonUnit::where('platoon_id', $platoonId)->exists();

        return [
            ($required && $hasUnits) ? 'required' : 'nullable',
            'integer',
            function ($attribute, $value, $fail) use ($platoonId) {
                if ($value && !PlatoonUnit::where('unit_id', $value)->where('platoon_id', $platoonId)->exists()) {
                    $fail('Choose a platoon number that belongs to the selected platoon.');
                }
            },
        ];
    }

    public static function roleId(string $roleName): ?int
    {
        return Role::whereRaw('lower(role_name) = ?', [strtolower($roleName)])->value('role_id');
    }
}
