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
        Schema::create('llm_accounts', function (Blueprint $table) {
          // Tidak ada PK tunggal — composite key
          $table->uuid('llm_account_id');
          $table->foreign('llm_account_id')
                ->references('account_id')->on('accounts')
                ->cascadeOnDelete();

          $table->uuid('llm_project_id');
          $table->foreign('llm_project_id')
                ->references('project_id')->on('projects')
                ->cascadeOnDelete();

          $table->uuid('llm_model_id');
          $table->foreign('llm_model_id')
                ->references('llm_model_id')->on('llm_models')
                ->cascadeOnDelete();

          $table->integer('llm_token_limits');
          $table->integer('llm_token_used')->default(0);
          $table->timestamp('llm_token_reset_date');

          // Composite PK
          $table->primary(['llm_account_id', 'llm_project_id']);
      });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('llm_accounts');
    }
};
