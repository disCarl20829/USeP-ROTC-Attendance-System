<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_info', function (Blueprint $table) {
            // Drops the foreign key referencing the non-existent users table
            $table->dropForeign('user_info_user_id_foreign');
        });
    }

    public function down(): void
    {
        Schema::table('user_info', function (Blueprint $table) {
            // Restore constraint if rolled back (optional)
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });
    }
};