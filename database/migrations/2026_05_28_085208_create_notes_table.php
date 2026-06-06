<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Creates the `notes` and `note_collaborators` tables.
 *
 * notes.user_id  → users.id  (unsignedBigInteger, matches users table PK)
 * notes.project_id → projects.project_id (uuid)
 * deleted_at for soft-delete (Trash feature)
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notes', function (Blueprint $table): void {
            $table->uuid('note_id')->primary();
            $table->unsignedBigInteger('user_id');
            $table->uuid('project_id');
            $table->string('title', 255);
            $table->json('content')->nullable();
            $table->boolean('is_shared')->default(false);
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');

            $table->foreign('project_id')
                ->references('project_id')
                ->on('projects')
                ->onDelete('cascade');

            $table->index(['project_id', 'is_shared']);
            $table->index('user_id');
        });

        Schema::create('note_collaborators', function (Blueprint $table): void {
            $table->uuid('note_id');
            $table->unsignedBigInteger('user_id');
            $table->boolean('can_edit')->default(true);

            $table->primary(['note_id', 'user_id']);

            $table->foreign('note_id')
                ->references('note_id')
                ->on('notes')
                ->onDelete('cascade');

            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('note_collaborators');
        Schema::dropIfExists('notes');
    }
};