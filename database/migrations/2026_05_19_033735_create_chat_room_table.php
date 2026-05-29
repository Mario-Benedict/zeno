<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chat_rooms', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('project_id');
            $table->foreign('project_id')
                ->references('project_id')
                ->on('projects')
                ->cascadeOnDelete();

            $table->enum('type', ['group', 'dm'])->index();
            $table->string('name')->nullable();
            $table->string('avatar_path')->nullable();

            $table->timestamps();

            $table->index(['project_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chat_rooms');
    }
};