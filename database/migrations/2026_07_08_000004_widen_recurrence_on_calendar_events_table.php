<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * `recurrence` widens from a `none`/`weekly` enum to a Google-Calendar-
     * style set (`none`, `daily`, `weekly`, `monthly`, `yearly`). Converting
     * the column from `enum` to plain `string` — rather than redeclaring a
     * wider enum — means adding another recurrence type later never needs a
     * migration again; the allowed set is enforced at the request-validation
     * layer (`StoreCalendarEventRequest`/`UpdateCalendarEventRequest`), the
     * same place every other "closed set of strings" column in this app
     * (e.g. `priority` before it) was validated.
     */
    public function up(): void
    {
        Schema::table('calendar_events', function (Blueprint $table) {
            $table->string('recurrence')->default('none')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('calendar_events', function (Blueprint $table) {
            $table->enum('recurrence', ['none', 'weekly'])->default('none')->change();
        });
    }
};
