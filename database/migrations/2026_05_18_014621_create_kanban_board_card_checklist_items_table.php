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
        Schema::create('kanban_board_card_checklist_items', function (Blueprint $table) {
            $table->uuid('kanban_board_card_checklist_item_id')->primary();
            $table->foreignUuid('kanban_board_card_checklist_id')
                ->constrained(
                    'kanban_board_card_checklists',
                    'kanban_board_card_checklist_id',
                    'kb_card_checkl_fk'
                )
                ->cascadeOnDelete();
            $table->string('kanban_board_card_checklist_item_name', 20);
            $table->boolean('is_completed')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kanban_board_card_checklist_items');
    }
};
