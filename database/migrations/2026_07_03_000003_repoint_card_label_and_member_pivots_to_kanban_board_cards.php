<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * See the previous migration for why SQLite gets a drop-and-recreate
     * branch instead of an ALTER (these tables are always empty when this
     * runs, so it's equivalent).
     */
    public function up(): void
    {
        if (Schema::getConnection()->getDriverName() === 'sqlite') {
            $this->recreateForSqlite();

            return;
        }

        Schema::table('kanban_board_card_labels', function (Blueprint $table) {
            $table->dropForeign(['kanban_board_card_detail_id']);
            $table->dropUnique('kb_card_labels_unique');
            $table->dropColumn('kanban_board_card_detail_id');

            $table->foreignUuid('kanban_board_card_id')
                ->constrained('kanban_board_cards', 'kanban_board_card_id')
                ->cascadeOnDelete();

            $table->unique(
                ['kanban_board_card_id', 'kanban_board_card_label_id'],
                'kb_card_labels_unique'
            );
        });

        Schema::table('kanban_board_card_members', function (Blueprint $table) {
            $table->dropForeign(['kanban_board_card_detail_id']);
            $table->dropColumn('kanban_board_card_detail_id');

            $table->foreignUuid('kanban_board_card_id')
                ->constrained('kanban_board_cards', 'kanban_board_card_id')
                ->cascadeOnDelete();
        });
    }

    private function recreateForSqlite(): void
    {
        Schema::dropIfExists('kanban_board_card_labels');
        Schema::create('kanban_board_card_labels', function (Blueprint $table) {
            $table->foreignUuid('kanban_board_card_id')
                ->constrained('kanban_board_cards', 'kanban_board_card_id')
                ->cascadeOnDelete();
            $table->foreignUuid('kanban_board_card_label_id')
                ->constrained('card_labels', 'card_label_id')
                ->cascadeOnDelete();
            $table->unique(
                ['kanban_board_card_id', 'kanban_board_card_label_id'],
                'kb_card_labels_unique'
            );
        });

        Schema::dropIfExists('kanban_board_card_members');
        Schema::create('kanban_board_card_members', function (Blueprint $table) {
            $table->foreignUuid('kanban_board_card_id')
                ->constrained('kanban_board_cards', 'kanban_board_card_id')
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
        Schema::table('kanban_board_card_labels', function (Blueprint $table) {
            $table->dropForeign(['kanban_board_card_id']);
            $table->dropUnique('kb_card_labels_unique');
            $table->dropColumn('kanban_board_card_id');

            $table->foreignUuid('kanban_board_card_detail_id')
                ->constrained('kanban_board_card_details', 'kanban_board_card_detail_id')
                ->cascadeOnDelete();

            $table->unique(
                ['kanban_board_card_detail_id', 'kanban_board_card_label_id'],
                'kb_card_labels_unique'
            );
        });

        Schema::table('kanban_board_card_members', function (Blueprint $table) {
            $table->dropForeign(['kanban_board_card_id']);
            $table->dropColumn('kanban_board_card_id');

            $table->foreignUuid('kanban_board_card_detail_id')
                ->constrained('kanban_board_card_details', 'kanban_board_card_detail_id')
                ->cascadeOnDelete();
        });
    }
};
