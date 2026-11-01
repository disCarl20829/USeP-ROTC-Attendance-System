<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('utilities', function (Blueprint $table) {
            $table->smallInteger('id');
            $table->time('default_start_time')->default('08:00');
            $table->time('default_end_time')->default('17:00');
            $table->time('default_late_time')->default('08:15');
            $table->foreignUuid('updated_by')->nullable()->constrained('auth.users')->nullOnDelete();
            $table->timestampTz('updated_at')->useCurrent();

            $table->primary('id');
        });

        DB::statement('ALTER TABLE utilities ADD CONSTRAINT utilities_id_check CHECK (id = 1)');
        DB::statement('ALTER TABLE utilities ADD CONSTRAINT utilities_default_time_order_check CHECK (default_start_time < default_end_time)');

        DB::table('utilities')->insert(['id' => 1]);
    }

    public function down(): void
    {
        Schema::dropIfExists('utilities');
    }
};
