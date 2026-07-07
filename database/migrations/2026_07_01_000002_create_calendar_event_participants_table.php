<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('calendar_event_participants', function (Blueprint $table) {
            $table->uuid('event_id');
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            $table->primary(['event_id', 'user_id']);
            $table->foreign('event_id')
                ->references('id')
                ->on('calendar_events')
                ->cascadeOnDelete();

            $table->index('user_id', 'cal_participants_user');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('calendar_event_participants');
    }
};
