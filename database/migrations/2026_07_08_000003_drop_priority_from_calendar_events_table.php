<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * The Low/Mid/High priority enum is replaced by real project CardLabels
     * (see the calendar_event_labels pivot created just before this), so the
     * scalar column is no longer read or written anywhere.
     */
    public function up(): void
    {
        Schema::table('calendar_events', function (Blueprint $table) {
            $table->dropColumn('priority');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('calendar_events', function (Blueprint $table) {
            $table->enum('priority', ['low', 'mid', 'high'])->default('mid');
        });
    }
};
