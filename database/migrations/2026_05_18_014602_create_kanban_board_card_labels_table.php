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
        Schema::create('kanban_board_card_labels', function (Blueprint $table) {
            $table->foreignUuid('kanban_board_card_detail_id')
                  ->constrained('kanban_board_card_details', 'kanban_board_card_detail_id')
                  ->cascadeOnDelete();
            $table->foreignUuid('kanban_board_card_label_id')
                  ->constrained('card_labels', 'card_label_id')
                  ->cascadeOnDelete();
            $table->unique(
                        ['kanban_board_card_detail_id', 'kanban_board_card_label_id'], 
                        'kb_card_labels_unique'
                    );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kanban_board_card_labels');
    }
};
