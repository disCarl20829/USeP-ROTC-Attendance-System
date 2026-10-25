<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('campus_list', function (Blueprint $table) {
            $table->id('campus_id');
            $table->string('campus_name');
            $table->foreignUuid('added_by')->constrained('auth.users')->nullOnDelete();
            $table->timestampTz('date_added')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('campus_list');
    }
};
