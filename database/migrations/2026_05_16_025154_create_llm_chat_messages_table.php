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
        Schema::create('llm_chat_messages', function (Blueprint $table) {
            $table->uuid('llm_chat_message_id')->primary();
            $table->uuid('llm_chat_session_id');
            $table->string('role', 20);
            $table->text('content');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('llm_chat_messages');
    }
};
