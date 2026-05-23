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
            // Kasih default 0 biar data lama nggak error
            $table->integer('position')->default(0)->after('kanban_board_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('kanban_board_cards', function (Blueprint $table) {
            //
        });
    }
};
