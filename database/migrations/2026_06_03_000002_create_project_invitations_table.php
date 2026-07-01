<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('project_invitations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('project_id');
            $table->foreignId('invited_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('email')->nullable();
            $table->string('name')->nullable();
            $table->enum('role', ['ADMIN', 'MEMBER', 'VIEWER'])->default('MEMBER');
            $table->string('token', 80)->unique();
            $table->timestamp('accepted_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->foreign('project_id')
                ->references('project_id')
                ->on('projects')
                ->cascadeOnDelete();

            $table->index(['project_id', 'email']);
            $table->index(['project_id', 'accepted_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_invitations');
    }
};
