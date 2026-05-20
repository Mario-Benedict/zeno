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
        Schema::create('llm_chat_sessions', function (Blueprint $table) {
            $table->uuid('llm_chat_session_id')->primary();
            $table->foreignId('llm_chat_account_id');
            $table->string('llm_chat_session_name', 20);
            $table->uuid('llm_chat_current_model_id');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('llm_chat_sessions');
    }
};
