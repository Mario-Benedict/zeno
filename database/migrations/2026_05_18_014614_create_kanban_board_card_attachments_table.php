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
        Schema::create('kanban_board_card_attachments', function (Blueprint $table) {
            $table->uuid('kanban_board_card_attachment_id')->primary();
            $table->foreignUuid('kanban_board_card_detail_id')
                  ->constrained(
                        'kanban_board_card_details',
                        'kanban_board_card_detail_id',
                        'kb_card_atch_detail_fk'
                    )
                  ->cascadeOnDelete();
            $table->string('kanban_board_card_attachment_name', 20)->nullable();
            $table->string('kanban_board_card_attachment_url', 20);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kanban_board_card_attachments');
    }
};
