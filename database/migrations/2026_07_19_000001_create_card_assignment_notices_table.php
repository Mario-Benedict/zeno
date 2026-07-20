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
        Schema::create('card_assignment_notices', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->foreignUuid('kanban_board_card_id')
                ->constrained('kanban_board_cards', 'kanban_board_card_id')
                ->cascadeOnDelete();
            $table->foreignId('assignee_user_id')
                ->constrained('users', 'id')
                ->cascadeOnDelete();
            $table->foreignId('assigned_by_user_id')
                ->constrained('users', 'id')
                ->cascadeOnDelete();

            $table->timestamp('read_at')->nullable();

            $table->timestamps();

            $table->index(
                ['assignee_user_id', 'read_at'],
                'card_assignment_notices_assignee_unread_idx'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('card_assignment_notices');
    }
};
