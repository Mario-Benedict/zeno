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
        Schema::create('kanban_board_card_details', function (Blueprint $table) {
            $table->uuid('kanban_board_card_detail_id')->primary();
            $table->foreignUuid('kanban_board_card_id')
                  ->unique()
                  ->constrained('kanban_board_cards', 'kanban_board_card_id')
                  ->cascadeOnDelete();
            $table->string('kanban_board_card_title', 20);
            $table->text('kanban_board_card_description')->nullable();
            $table->boolean('is_completed')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kanban_board_card_details');
    }
};
