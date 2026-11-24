<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE utilities ADD COLUMN IF NOT EXISTS welcome_video_url text');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE utilities DROP COLUMN IF EXISTS welcome_video_url');
    }
};
