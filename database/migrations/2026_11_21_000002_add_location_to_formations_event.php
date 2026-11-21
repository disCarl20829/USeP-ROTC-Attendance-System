<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE formations_event ADD COLUMN IF NOT EXISTS location varchar(255)');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE formations_event DROP COLUMN IF EXISTS location');
    }
};
