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
        Schema::create('kanban_board_cards', function (Blueprint $table) {
            $table->uuid('kanban_board_card_id')->primary();
            $table->foreignUuid('kanban_board_id')
                  ->constrained('kanban_boards', 'kanban_board_id')
                  ->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kanban_board_cards');
    }
};
