<?php

namespace Database\Seeders;

use App\Models\Campus;
use App\Models\Course;
use App\Models\FormationEvent;
use App\Models\FormationSession;
use App\Models\Platoon;
use App\Models\Role;
use App\Models\Specialization;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Demo data for testing the QR flow:
 *   php artisan db:seed --class=DemoSeeder   (or just: php artisan db:seed)
 *
 * - Fills the lookup lists ONLY when they are empty (safe to run on master-db).
 * - Adds a whole-day "Demo Formation" for today (morning + afternoon sessions).
 *
 * Accounts and profiles are NOT seeded: register at /register, finish /setup,
 * then promote yourself with `php artisan rotc:make-admin you@usep.edu.ph`.
 * The scanner accepts a cadet's QR code or a typed student ID.
 */
class DemoSeeder extends Seeder
{
    public function run(): void
    {
        // Lookup tables require added_by -> auth.users, so we need at least one account.
        $owner = DB::table('auth.users')->orderBy('created_at')->value('id');

        if (!$owner) {
            $this->command?->warn('No Supabase account found. Register at /register first, then run this again.');

            return;
        }

        $this->seedIfEmpty(Role::class, 'role_name', ['Admin', 'Officer', 'Aspirant', 'Cadet'], $owner);
        $this->seedIfEmpty(Campus::class, 'campus_name', ['Tagum', 'Mabini'], $owner);
        $this->seedIfEmpty(Platoon::class, 'platoon_name', ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf'], $owner);

        if (Specialization::count() === 0) {
            Specialization::create(['specialization_name' => 'Unspecified', 'added_by' => $owner]);
        }

        if (Course::count() === 0) {
            $tagum = Campus::where('campus_name', 'Tagum')->value('campus_id');
            Course::create([
                'course_name' => 'Bachelor of Science in Information Technology - Information Security',
                'campus_name' => $tagum, // column holds the campus id
                'added_by'    => $owner,
            ]);
        }

        $event = FormationEvent::firstOrCreate(
            ['formation_name' => 'Demo Formation', 'formation_date' => now(config('rotc.timezone'))->toDateString()],
            ['formation_type' => 'whole_day', 'location' => 'Grandstand', 'created_by' => $owner]
        );

        foreach ([
            'morning'   => ['06:00', '06:15', '12:00'],
            'afternoon' => ['13:00', '13:15', '17:00'],
        ] as $type => [$start, $late, $end]) {
            FormationSession::firstOrCreate(
                ['formation_id' => $event->formation_id, 'session_type' => $type],
                ['start_time' => $start, 'late_time' => $late, 'end_time' => $end]
            );
        }

        $this->command?->info("Demo data ready: \"Demo Formation\" today (morning + afternoon).");
        $this->command?->comment('Open /qr-scanner, pick a session, and scan a cadet QR code or type a student ID.');
    }

    private function seedIfEmpty(string $model, string $column, array $names, string $owner): void
    {
        if ($model::count() > 0) {
            return;
        }

        foreach ($names as $name) {
            $model::create([$column => $name, 'added_by' => $owner]);
        }
    }
}
