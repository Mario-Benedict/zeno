<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('calendar_event_labels', function (Blueprint $table) {
            $table->foreignUuid('calendar_event_id')
                ->constrained('calendar_events', 'id')
                ->cascadeOnDelete();
            $table->foreignUuid('card_label_id')
                ->constrained('card_labels', 'card_label_id')
                ->cascadeOnDelete();

            $table->unique(
                ['calendar_event_id', 'card_label_id'],
                'calendar_event_labels_unique'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('calendar_event_labels');
    }
};
