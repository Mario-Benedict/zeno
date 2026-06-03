<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * llm_accounts tracks per-user, per-project LLM token usage.
     *
     * Composite PK: (llm_account_id, llm_project_id) — one row per user+project pair.
     *
     * Runs AFTER llm_models (025114) so the FK to llm_models is valid.
     * llm_account_id references users.id (bigint unsigned), not a uuid.
     */
    public function up(): void
    {
        Schema::create('llm_accounts', function (Blueprint $table) {
            // References the authenticated user — users.id is a bigint
            $table->foreignId('llm_account_id')
                ->constrained('users', 'id')
                ->cascadeOnDelete();

            $table->foreignUuid('llm_project_id')
                ->constrained('projects', 'project_id')
                ->cascadeOnDelete();

            $table->foreignUuid('llm_model_id')
                ->constrained('llm_models', 'llm_model_id')
                ->cascadeOnDelete();

            $table->integer('llm_token_limits');
            $table->integer('llm_token_used')->default(0);
            $table->timestamp('llm_token_reset_date');

            $table->primary(['llm_account_id', 'llm_project_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('llm_accounts');
    }
};
