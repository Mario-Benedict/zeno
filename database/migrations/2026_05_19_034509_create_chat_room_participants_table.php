<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chat_room_participants', function (Blueprint $table) {
            $table->id();

            $table->foreignUuid('chat_room_id')
                ->constrained('chat_rooms', 'id')
                ->cascadeOnDelete();

            $table->foreignId('user_id')
                ->constrained('users', 'id')
                ->cascadeOnDelete();

            $table->enum('role', ['member', 'admin'])->default('member');
            $table->boolean('is_muted')->default(false);
            $table->string('last_read_message_id')->nullable();
            $table->timestamp('joined_at')->useCurrent();

            $table->unique(['chat_room_id', 'user_id']);
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chat_room_participants');
    }
};
