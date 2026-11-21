<?php

/*
|--------------------------------------------------------------------------
| ROTC attendance rules
|--------------------------------------------------------------------------
| Role names must match role_list.role_name (case-insensitive).
*/

return [

    'timezone' => 'Asia/Manila',

    // Role every self-registered account receives.
    'default_role' => 'cadet',

    // Roles whose attendance is taken (roster, reports, automatic absences).
    // Keep in sync with public.mark_absent_cadets() in the database.
    'attendance_roles' => ['cadet', 'aspirant'],

    // Specialization given to non-cadets / unassigned profiles.
    'default_specialization' => 'Unspecified',

    // Points per attendance status (Reports, Excel export, Dashboard).
    'points' => [
        'present' => 10,
        'late'    => 5,
        'excused' => 8,
        'absent'  => 0,
    ],

    // Permission => roles allowed. Admin is always allowed everything.
    'permissions' => [
        'scan'            => ['officer', 'aspirant'], // QR scanner + changing a scanned status
        'attendance.view' => ['officer', 'aspirant'],
        'cadets.manage'   => ['officer'],             // add / edit / drop cadets
        'cadets.assign'   => ['officer'],             // set platoon & specialization
        'cadets.delete'   => [],                      // permanently delete a profile (admin only)
        'roles.assign'    => [],                      // change a user's role (admin only)
        'events.manage'   => ['officer'],
        'reports.view'    => ['officer'],
        'settings.system' => [],                      // default start/end/late times (admin only)
    ],
];
