<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Each LLM chat session belongs to a user (users.id — bigint) and
     * is pinned to a specific LLM model.
     *
     * llm_chat_account_id is a bigint (not uuid) because users.id is bigint.
     * Runs after llm_models (025114) and llm_accounts (025115).
     */
    public function up(): void
    {
        Schema::create('llm_chat_sessions', function (Blueprint $table) {
            $table->uuid('llm_chat_session_id')->primary();

            // References the authenticated user — users.id is a bigint
            $table->foreignId('llm_chat_account_id')
                ->constrained('users', 'id')
                ->cascadeOnDelete();

            $table->string('llm_chat_session_name', 100);

            $table->foreignUuid('llm_chat_current_model_id')
                ->constrained('llm_models', 'llm_model_id')
                ->restrictOnDelete();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('llm_chat_sessions');
    }
};
