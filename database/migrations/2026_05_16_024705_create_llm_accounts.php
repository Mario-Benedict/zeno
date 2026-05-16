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
            $table->uuid('llm_account_id');
            $table->uuid('llm_project_id');
            $table->uuid('llm_model_id');
            $table->integer('llm_token_limits');
            $table->integer('llm_token_used');
            $table->timestamp('llm_token_reset_date');
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
