<?php

use App\Models\UserInfo;
use App\Support\LookupOptions;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

Artisan::command('rotc:make-admin {email} {--first= : First name (only if no profile yet)} {--last= : Last name} {--student-id= : Student ID}', function (string $email) {
    $email = strtolower(trim($email));

    if (!preg_match('/^[^@\s]+@usep\.edu\.ph$/', $email)) {
        $this->error('Use a @usep.edu.ph email.');

        return 1;
    }

    $adminRoleId = LookupOptions::roleId('admin');
    if (!$adminRoleId) {
        $this->error('No "Admin" role in role_list.');

        return 1;
    }

    $profile = UserInfo::findByEmail($email);

    if ($profile) {
        $profile->update([
            'role_id'        => $adminRoleId,
            'school_year_id' => null, // staff are not part of a cadet batch
            'archived_at'    => null,
        ]);
        $this->info("{$profile->full_name} <{$email}> is now an Admin.");

        return 0;
    }

    // No profile yet (admins are upperclassmen, so they can't self-register as first years).
    $first     = $this->option('first') ?: $this->ask('First name');
    $last      = $this->option('last') ?: $this->ask('Last name');
    $studentId = $this->option('student-id') ?: $this->ask('Student ID (e.g. 2022-00123)');

    if (!$first || !$last || !$studentId) {
        $this->error('First name, last name and student ID are required.');

        return 1;
    }

    if (UserInfo::findByStudentId($studentId)) {
        $this->error("Student ID {$studentId} is already used by another profile.");

        return 1;
    }

    // Already has a login (e.g. registered but was blocked by the first-year rule)? Link it now.
    $loginId = DB::table('auth.users')->whereRaw('lower(email) = ?', [$email])->value('id');

    $profile = UserInfo::create([
        'user_id'           => $loginId ?? (string) Str::uuid(),
        'first_name'        => trim($first),
        'last_name'         => trim($last),
        'email'             => $email,
        'student_id'        => trim($studentId),
        'campus_id'         => \App\Models\Campus::orderBy('campus_id')->value('campus_id'),
        'course_id'         => \App\Models\Course::orderBy('course_id')->value('course_id'),
        'role_id'           => $adminRoleId,
        'specialization_id' => \App\Models\Specialization::defaultId(),
        'status'            => 'active',
    ]);
    $profile->ensureQrToken();

    $this->info($loginId
        ? "Admin profile created for {$email}. They can log in now (campus/course can be fixed in Settings)."
        : "Admin profile created for {$email}. When they register with this email, their account links to it automatically.");

    return 0;
})->purpose('Make a user an Admin (creates the profile if needed)');

Artisan::command('rotc:mark-absent', function () {
    $count = DB::selectOne('SELECT public.mark_absent_cadets() AS n')->n;
    $this->info("Marked {$count} absence(s).");
})->purpose('Run the automatic absent marking now (normally done by pg_cron every 5 minutes)');
