<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * Entry point for `php artisan db:seed`.
 *
 * Users live in Supabase (auth.users), not in a Laravel `users` table,
 * so the stock Breeze "Test User" seeding was removed. This only runs the
 * DemoSeeder, which builds reference data + a demo event for QR testing.
 */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(DemoSeeder::class);
    }
}
