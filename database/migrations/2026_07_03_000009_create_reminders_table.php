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
        Schema::create('reminders', function (Blueprint $table) {
            $table->uuid('reminder_id')->primary();

            $table->foreignUuid('reminder_project_id')
                ->constrained('projects', 'project_id')
                ->cascadeOnDelete();
            $table->foreignId('reminder_user_id')
                ->constrained('users', 'id')
                ->cascadeOnDelete();

            $table->string('reminder_title', 255);
            $table->text('reminder_description')->nullable();
            $table->timestamp('reminder_due_at')->nullable();
            $table->boolean('is_completed')->default(false);
            $table->boolean('is_pinned')->default(false);
            $table->enum('source', ['manual', 'kanban'])->default('manual');

            $table->foreignUuid('kanban_board_card_id')
                ->nullable()
                ->constrained('kanban_board_cards', 'kanban_board_card_id')
                ->cascadeOnDelete();

            $table->timestamps();

            $table->unique(['kanban_board_card_id', 'reminder_user_id']);
            $table->index(
                ['reminder_project_id', 'reminder_user_id', 'is_completed'],
                'reminders_project_user_completed_idx'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reminders');
    }
};
