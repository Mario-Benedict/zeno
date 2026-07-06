<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * `kanban_board_card_start_date` / `kanban_board_card_due_date` now live
     * directly on `kanban_board_cards` (see the migration that added them),
     * so this table is redundant.
     */
    public function up(): void
    {
        Schema::dropIfExists('kanban_board_card_dates');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::create('kanban_board_card_dates', function (Blueprint $table) {
            $table->uuid('kanban_board_card_date_id')->primary();
            $table->foreignUuid('kanban_board_card_detail_id')
                ->unique()
                ->constrained('kanban_board_card_details', 'kanban_board_card_detail_id')
                ->cascadeOnDelete();
            $table->timestamp('kanban_board_card_start_date')->nullable();
            $table->timestamp('kanban_board_card_due_date')->nullable();
            $table->timestamps();
        });
    }
};
