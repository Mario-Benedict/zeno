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
        Schema::create('task_conflicts', function (Blueprint $table) {
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

            // Snapshot of the other commitment at detection time, so the
            // notification still reads sensibly even if that other event or
            // card is later renamed/moved.
            $table->string('conflicting_title', 255);
            $table->dateTime('conflicting_start');
            $table->dateTime('conflicting_end');

            $table->enum('status', ['pending', 'accepted', 'declined'])->default('pending');
            $table->timestamp('assignee_acknowledged_at')->nullable();
            $table->timestamp('assigner_acknowledged_at')->nullable();

            $table->timestamps();

            $table->index(
                ['assignee_user_id', 'assignee_acknowledged_at'],
                'task_conflicts_assignee_pending_idx'
            );
            $table->index(
                ['assigned_by_user_id', 'status', 'assigner_acknowledged_at'],
                'task_conflicts_assigner_decline_idx'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('task_conflicts');
    }
};
