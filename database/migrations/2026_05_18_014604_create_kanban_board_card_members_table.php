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
        Schema::create('kanban_board_card_members', function (Blueprint $table) {
            $table->foreignUuid('kanban_board_card_detail_id')
                ->constrained('kanban_board_card_details', 'kanban_board_card_detail_id')
                ->cascadeOnDelete();
            $table->foreignId('kanban_board_card_account_id')
                ->constrained('users', 'id')
                ->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kanban_board_card_members');
    }
};
