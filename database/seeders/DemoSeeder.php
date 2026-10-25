<?php

namespace Database\Seeders;

use App\Models\AttendanceQr;
use App\Models\Campus;
use App\Models\Course;
use App\Models\FormationEvent;
use App\Models\FormationSession;
use App\Models\Platoon;
use App\Models\Role;
use App\Models\UserInfo;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Creates the minimum data needed to test the QR scan flow.
 *
 * It uses the FIRST account in Supabase auth.users (normally your own
 * account). Run it with:
 *
 *     php artisan db:seed --class=DemoSeeder
 *
 * The QR token and session ID are printed to the console.
 */
class DemoSeeder extends Seeder
{
    public function run(): void
    {
        $campus = Campus::firstOrCreate(['campus_name' => 'Tagum-Mabini Campus']);
        $course = Course::firstOrCreate(['course_name' => 'BSIT']);
        $platoon = Platoon::firstOrCreate(['platoon_name' => 'Alpha']);
        $role = Role::firstOrCreate(['role_name' => 'Cadet']);

        $authUser = DB::table('auth.users')
            ->select('id', 'email')
            ->orderBy('created_at')
            ->first();

        if (! $authUser) {
            $this->command?->warn('No Supabase auth user found. Create an account first.');
            return;
        }

        $email = strtolower((string) $authUser->email);

        if (! preg_match('/^[^@\s]+@usep\.edu\.ph$/', $email)) {
            $this->command?->warn(
                "The first auth user ({$email}) is not a @usep.edu.ph address. ".
                'Create a USeP account or adjust the data manually.'
            );
            return;
        }

        $profile = UserInfo::firstOrCreate(
            ['user_id' => $authUser->id],
            [
                'first_name' => 'Demo',
                'last_name' => 'Cadet',
                'email' => $email,
                'campus_id' => $campus->campus_id,
                'course_id' => $course->course_id,
                'role_id' => $role->role_id,
                'platoon_id' => $platoon->platoon_id,
                'placement' => 1,
            ]
        );

        $qr = AttendanceQr::firstOrCreate(
            ['user_id' => $profile->user_id],
            [
                'qr_token' => (string) Str::uuid(),
                'is_active' => true,
            ]
        );

        $event = FormationEvent::firstOrCreate(
            [
                'formation_name' => 'Demo Morning Formation',
                'formation_date' => now()->toDateString(),
            ],
            [
                'formation_type' => 'whole_day',
                'created_by' => $authUser->id,
            ]
        );

        $session = FormationSession::firstOrCreate(
            [
                'formation_id' => $event->formation_id,
                'session_type' => 'morning',
            ],
            [
                'start_time' => '06:00',
                'end_time' => '08:00',
                'late_time' => '06:15',
            ]
        );

        $this->command?->info('Demo data is ready.');
        $this->command?->line('  Cadet:      '.$profile->first_name.' '.$profile->last_name.' ('.$email.')');
        $this->command?->line('  QR token:   '.$qr->qr_token);
        $this->command?->line('  Session ID: '.$session->session_id.' (Demo Morning Formation)');
        $this->command?->newLine();
        $this->command?->comment('Open /qr-scanner, select the session, paste the QR token, and scan.');
    }
}
