<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('project_user', function (Blueprint $table) {
            $table->uuid('project_id');
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('role', ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'])->default('MEMBER');
            $table->boolean('is_pinned')->default(false);
            $table->timestamp('opened_at')->nullable();

            $table->primary(['project_id', 'user_id']);
            $table->foreign('project_id')
                ->references('project_id')
                ->on('projects')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_user');
    }
};
