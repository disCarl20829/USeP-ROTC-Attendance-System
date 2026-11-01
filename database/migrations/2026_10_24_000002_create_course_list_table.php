<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('course_list', function (Blueprint $table) {
            $table->id('course_id');
            $table->string('course_name');
            $table->foreignUuid('added_by')->constrained('auth.users')->nullOnDelete();
            $table->timestampTz('date_added')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('course_list');
    }
};
