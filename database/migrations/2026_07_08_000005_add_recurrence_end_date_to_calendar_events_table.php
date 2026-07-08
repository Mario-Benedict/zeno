<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Optional upper bound for a recurring event — "repeat until this date"
     * (Google Calendar's "Ends on"). `null` means the recurrence has no end
     * date and keeps expanding up to the existing safety horizon in
     * `CalendarService::RECURRENCE_HORIZON_MONTHS`.
     */
    public function up(): void
    {
        Schema::table('calendar_events', function (Blueprint $table) {
            $table->date('recurrence_end_date')->nullable()->after('recurrence_group_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('calendar_events', function (Blueprint $table) {
            $table->dropColumn('recurrence_end_date');
        });
    }
};
