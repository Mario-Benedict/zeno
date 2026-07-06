<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('note_collaborators', function (Blueprint $table) {
            $table->uuid('note_id');
            $table->foreign('note_id')->references('note_id')->on('notes')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->boolean('can_edit')->default(true);

            $table->primary(['note_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('note_collaborators');
    }
};
