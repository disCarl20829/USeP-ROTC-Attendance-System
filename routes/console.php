<?php

use App\Models\UserInfo;
use App\Support\LookupOptions;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

Artisan::command('rotc:make-admin {email}', function (string $email) {
    $profile = UserInfo::findByEmail($email);

    if (!$profile) {
        $this->error("No profile for {$email}. The user must register and finish account setup first.");

        return 1;
    }

    $adminRoleId = LookupOptions::roleId('admin');
    if (!$adminRoleId) {
        $this->error('No "Admin" role in role_list.');

        return 1;
    }

    $profile->role_id = $adminRoleId;
    $profile->save();

    $this->info("{$profile->full_name} <{$profile->email}> is now an Admin.");

    return 0;
})->purpose('Give a registered user the Admin role');

Artisan::command('rotc:mark-absent', function () {
    $count = DB::selectOne('SELECT public.mark_absent_cadets() AS n')->n;
    $this->info("Marked {$count} absence(s).");
})->purpose('Run the automatic absent marking now (normally done by pg_cron every 5 minutes)');
