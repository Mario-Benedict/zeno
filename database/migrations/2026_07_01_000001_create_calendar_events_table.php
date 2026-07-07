<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('calendar_events', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('project_id');
            $table->string('title');
            $table->text('description')->nullable();
            $table->dateTime('start_time');
            $table->dateTime('end_time');
            $table->enum('priority', ['low', 'mid', 'high'])->default('mid');
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->enum('recurrence', ['none', 'weekly'])->default('none');
            $table->uuid('recurrence_group_id')->nullable();
            $table->timestamps();

            $table->foreign('project_id')
                ->references('project_id')
                ->on('projects')
                ->cascadeOnDelete();

            $table->index(['project_id', 'start_time', 'end_time'], 'cal_events_project_range');
            $table->index('recurrence_group_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('calendar_events');
    }
};
