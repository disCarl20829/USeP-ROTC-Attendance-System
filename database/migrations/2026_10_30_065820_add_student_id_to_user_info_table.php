<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Adds the student ID and enrollment status columns.
 * (This migration was originally empty: the columns were added in Supabase by hand.
 * Everything here is idempotent so it is safe on databases that already have them.)
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE user_info ADD COLUMN IF NOT EXISTS student_id text');
        DB::statement("ALTER TABLE user_info ADD COLUMN IF NOT EXISTS status varchar(255) DEFAULT 'active'");
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE user_info DROP COLUMN IF EXISTS student_id');
        DB::statement('ALTER TABLE user_info DROP COLUMN IF EXISTS status');
    }
};
