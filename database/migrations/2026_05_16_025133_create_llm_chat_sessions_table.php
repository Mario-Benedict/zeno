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

          $table->uuid('llm_chat_account_id');
          $table->foreign('llm_chat_account_id')
                ->references('account_id')->on('accounts')
                ->cascadeOnDelete();

          $table->string('llm_chat_session_name', 100);

          $table->uuid('llm_chat_current_model_id');
          $table->foreign('llm_chat_current_model_id')
                ->references('llm_model_id')->on('llm_models')
                ->restrictOnDelete(); // ERD pakai - (one-to-one ref), jangan null/cascade

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
