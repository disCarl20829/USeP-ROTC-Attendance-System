<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('formations_event', function (Blueprint $table) {
            $table->id('formation_id');
            $table->string('formation_name');
            $table->date('formation_date');
            $table->string('formation_type');
            $table->foreignUuid('created_by')->constrained('auth.users')->restrictOnDelete();
            $table->timestampTz('date_added')->useCurrent();
        });

        DB::statement('ALTER TABLE formations_event ADD CONSTRAINT formations_event_formation_type_check CHECK (formation_type IN (\'whole_day\', \'half_day\'))');
    }

    public function down(): void
    {
        Schema::dropIfExists('formations_event');
    }
};
