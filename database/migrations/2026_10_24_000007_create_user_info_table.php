<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_info', function (Blueprint $table) {
            $table->id('info_id');
            $table->foreignUuid('user_id')->unique()->constrained('auth.users')->cascadeOnDelete();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('email');
            $table->foreignId('campus_id')->constrained('campus_list', 'campus_id');
            $table->foreignId('course_id')->constrained('course_list', 'course_id');
            $table->foreignId('role_id')->constrained('role_list', 'role_id');
            $table->foreignId('platoon_id')->constrained('platoon_list', 'platoon_id');
            $table->smallInteger('placement');
            $table->boolean('is_system_admin')->default(false);
            $table->timestampTz('date_added')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent();

            $table->index('campus_id');
            $table->index('course_id');
            $table->index('role_id');
            $table->index('platoon_id');
        });

        DB::statement('ALTER TABLE user_info ADD CONSTRAINT user_info_placement_check CHECK (placement IN (1, 2, 3))');
        DB::statement('ALTER TABLE user_info ADD CONSTRAINT user_info_email_domain_check CHECK (lower(trim(email)) ~ \'^[^@[:space:]]+@usep[.]edu[.]ph$\'');
    }

    public function down(): void
    {
        Schema::dropIfExists('user_info');
    }
};
