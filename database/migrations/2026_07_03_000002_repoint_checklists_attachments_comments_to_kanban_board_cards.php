<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * SQLite's native `ALTER TABLE ... DROP COLUMN` refuses to drop a
     * column that participates in a foreign key constraint at all — toggling
     * `dropForeign()` doesn't matter, the restriction is enforced by SQLite
     * itself. Since these tables are always empty when this migration runs
     * (fresh dev DB / the in-memory test DB), the SQLite branch just drops
     * and recreates each table with its final shape instead of altering it.
     * MySQL keeps the real ALTER path.
     */
    public function up(): void
    {
        if (Schema::getConnection()->getDriverName() === 'sqlite') {
            $this->recreateForSqlite();

            return;
        }

        Schema::table('kanban_board_card_checklists', function (Blueprint $table) {
            $table->dropForeign('kb_card_checkl_detail_fk');
            $table->dropColumn('kanban_board_card_checklist_detail_id');
            $table->foreignUuid('kanban_board_card_id')
                ->after('kanban_board_card_checklist_id')
                ->constrained('kanban_board_cards', 'kanban_board_card_id')
                ->cascadeOnDelete();
        });

        Schema::table('kanban_board_card_attachments', function (Blueprint $table) {
            $table->dropForeign('kb_card_atch_detail_fk');
            $table->dropColumn('kanban_board_card_detail_id');
            $table->foreignUuid('kanban_board_card_id')
                ->after('kanban_board_card_attachment_id')
                ->constrained('kanban_board_cards', 'kanban_board_card_id')
                ->cascadeOnDelete();
        });

        Schema::table('kanban_board_card_comments', function (Blueprint $table) {
            $table->dropForeign('kb_card_detail_fk');
            $table->dropColumn('kanban_board_card_detail_id');
            $table->foreignUuid('kanban_board_card_id')
                ->after('kanban_board_card_comment_id')
                ->constrained('kanban_board_cards', 'kanban_board_card_id')
                ->cascadeOnDelete();
        });
    }

    private function recreateForSqlite(): void
    {
        Schema::dropIfExists('kanban_board_card_checklists');
        Schema::create('kanban_board_card_checklists', function (Blueprint $table) {
            $table->uuid('kanban_board_card_checklist_id')->primary();
            $table->foreignUuid('kanban_board_card_id')
                ->constrained('kanban_board_cards', 'kanban_board_card_id')
                ->cascadeOnDelete();
            $table->string('kanban_board_card_checklist_name', 20);
            $table->timestamps();
        });

        Schema::dropIfExists('kanban_board_card_attachments');
        Schema::create('kanban_board_card_attachments', function (Blueprint $table) {
            $table->uuid('kanban_board_card_attachment_id')->primary();
            $table->foreignUuid('kanban_board_card_id')
                ->constrained('kanban_board_cards', 'kanban_board_card_id')
                ->cascadeOnDelete();
            $table->string('kanban_board_card_attachment_name', 20)->nullable();
            $table->string('kanban_board_card_attachment_url', 20);
            $table->timestamps();
        });

        Schema::dropIfExists('kanban_board_card_comments');
        Schema::create('kanban_board_card_comments', function (Blueprint $table) {
            $table->uuid('kanban_board_card_comment_id')->primary();
            $table->foreignUuid('kanban_board_card_id')
                ->constrained('kanban_board_cards', 'kanban_board_card_id')
                ->cascadeOnDelete();
            $table->foreignId('kanban_board_card_comment_from')
                ->constrained('users', 'id')
                ->cascadeOnDelete();
            $table->text('kanban_board_card_comment_message');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('kanban_board_card_checklists', function (Blueprint $table) {
            $table->dropForeign(['kanban_board_card_id']);
            $table->dropColumn('kanban_board_card_id');
            $table->foreignUuid('kanban_board_card_checklist_detail_id')
                ->after('kanban_board_card_checklist_id')
                ->constrained('kanban_board_card_details', 'kanban_board_card_detail_id')
                ->cascadeOnDelete();
        });

        Schema::table('kanban_board_card_attachments', function (Blueprint $table) {
            $table->dropForeign(['kanban_board_card_id']);
            $table->dropColumn('kanban_board_card_id');
            $table->foreignUuid('kanban_board_card_detail_id')
                ->after('kanban_board_card_attachment_id')
                ->constrained('kanban_board_card_details', 'kanban_board_card_detail_id')
                ->cascadeOnDelete();
        });

        Schema::table('kanban_board_card_comments', function (Blueprint $table) {
            $table->dropForeign(['kanban_board_card_id']);
            $table->dropColumn('kanban_board_card_id');
            $table->foreignUuid('kanban_board_card_detail_id')
                ->after('kanban_board_card_comment_id')
                ->constrained('kanban_board_card_details', 'kanban_board_card_detail_id')
                ->cascadeOnDelete();
        });
    }
};
