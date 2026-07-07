<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_dashboard_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->uuid('project_id');
            $table->foreign('project_id')->references('project_id')->on('projects')->cascadeOnDelete();
            $table->string('template_id', 10)->nullable();
            $table->json('slots')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'project_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_dashboard_settings');
    }
};
