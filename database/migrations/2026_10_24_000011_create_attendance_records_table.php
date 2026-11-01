<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendance_records', function (Blueprint $table) {
            $table->id('record_id');
            $table->foreignUuid('user_id')->constrained('user_info', 'user_id')->cascadeOnDelete();
            $table->foreignId('session_id')->constrained('formation_sessions', 'session_id')->cascadeOnDelete();
            $table->timestampTz('time_in')->nullable();
            $table->timestampTz('time_out')->nullable();
            $table->foreignUuid('time_in_scanned_by')->nullable()->constrained('auth.users')->nullOnDelete();
            $table->foreignUuid('time_out_scanned_by')->nullable()->constrained('auth.users')->nullOnDelete();
            $table->text('status')->default('present');
            $table->timestampTz('date_added')->useCurrent();

            $table->unique(['user_id', 'session_id']);
            $table->index('session_id');
            $table->index('user_id');
        });

        DB::statement('ALTER TABLE attendance_records ADD CONSTRAINT attendance_records_time_out_after_time_in_check CHECK (time_in IS NULL OR time_out IS NULL OR time_out >= time_in)');
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance_records');
    }
};
