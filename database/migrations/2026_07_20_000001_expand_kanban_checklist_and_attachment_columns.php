<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('kanban_board_card_checklists', function (Blueprint $table) {
            $table->string('kanban_board_card_checklist_name', 255)->change();
        });

        Schema::table('kanban_board_card_checklist_items', function (Blueprint $table) {
            $table->string('kanban_board_card_checklist_item_name', 255)->change();
        });

        Schema::table('kanban_board_card_attachments', function (Blueprint $table) {
            $table->string('kanban_board_card_attachment_name', 255)->nullable()->change();
            $table->string('kanban_board_card_attachment_url', 2048)->change();
        });
    }

    public function down(): void
    {
        Schema::table('kanban_board_card_checklists', function (Blueprint $table) {
            $table->string('kanban_board_card_checklist_name', 20)->change();
        });

        Schema::table('kanban_board_card_checklist_items', function (Blueprint $table) {
            $table->string('kanban_board_card_checklist_item_name', 20)->change();
        });

        Schema::table('kanban_board_card_attachments', function (Blueprint $table) {
            $table->string('kanban_board_card_attachment_name', 20)->nullable()->change();
            $table->string('kanban_board_card_attachment_url', 20)->change();
        });
    }
};
