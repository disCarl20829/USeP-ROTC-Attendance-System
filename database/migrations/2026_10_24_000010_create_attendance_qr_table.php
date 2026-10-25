<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendance_qr', function (Blueprint $table) {
            $table->id('qr_id');
            $table->foreignUuid('user_id')->unique()->constrained('user_info', 'user_id')->cascadeOnDelete();
            $table->uuid('qr_token')->unique();
            $table->boolean('is_active')->default(true);
            $table->timestampTz('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance_qr');
    }
};
