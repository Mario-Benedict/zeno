<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notes', function (Blueprint $table) {
            $table->uuid('note_id')->primary();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->uuid('project_id');
            $table->foreign('project_id')->references('project_id')->on('projects')->cascadeOnDelete();
            $table->string('title');
            $table->json('content');
            $table->boolean('is_shared')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['project_id', 'is_shared']);
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notes');
    }
};
