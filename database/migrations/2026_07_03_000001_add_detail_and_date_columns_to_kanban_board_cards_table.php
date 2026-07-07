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
        Schema::table('kanban_board_cards', function (Blueprint $table) {
            $table->string('kanban_board_card_title', 20)->after('position');
            $table->text('kanban_board_card_description')->nullable()->after('kanban_board_card_title');
            $table->boolean('is_completed')->default(false)->after('kanban_board_card_description');
            $table->timestamp('kanban_board_card_start_date')->nullable()->after('is_completed');
            $table->timestamp('kanban_board_card_due_date')->nullable()->after('kanban_board_card_start_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('kanban_board_cards', function (Blueprint $table) {
            $table->dropColumn([
                'kanban_board_card_title',
                'kanban_board_card_description',
                'is_completed',
                'kanban_board_card_start_date',
                'kanban_board_card_due_date',
            ]);
        });
    }
};
