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
        Schema::create('kanban_boards', function (Blueprint $table) {
            $table->uuid('kanban_board_id')->primary();
            $table->foreignUuid('kanban_board_project_id')
                  ->constrained('projects', 'project_id')
                  ->cascadeOnDelete();
            $table->string('kanban_board_name', 20);
            $table->integer('kanban_board_position')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kanban_boards');
    }
};
