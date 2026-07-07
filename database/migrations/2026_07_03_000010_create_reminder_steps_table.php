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
        Schema::create('reminder_steps', function (Blueprint $table) {
            $table->uuid('reminder_step_id')->primary();

            $table->foreignUuid('reminder_id')
                ->constrained('reminders', 'reminder_id')
                ->cascadeOnDelete();

            $table->string('reminder_step_name', 255);
            $table->boolean('is_completed')->default(false);
            $table->unsignedInteger('position')->default(0);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reminder_steps');
    }
};
