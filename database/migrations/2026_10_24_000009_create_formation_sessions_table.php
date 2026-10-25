<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('formation_sessions', function (Blueprint $table) {
            $table->id('session_id');
            $table->foreignId('formation_id')->constrained('formations_event', 'formation_id')->cascadeOnDelete();
            $table->string('session_type');
            $table->time('start_time');
            $table->time('end_time');
            $table->time('late_time');
            $table->timestampTz('date_added')->useCurrent();

            $table->unique(['formation_id', 'session_type']);
        });

        DB::statement('ALTER TABLE formation_sessions ADD CONSTRAINT formation_sessions_session_type_check CHECK (session_type IN (\'morning\', \'afternoon\'))');
        DB::statement('ALTER TABLE formation_sessions ADD CONSTRAINT session_time_order CHECK (start_time < end_time)');
    }

    public function down(): void
    {
        Schema::dropIfExists('formation_sessions');
    }
};
