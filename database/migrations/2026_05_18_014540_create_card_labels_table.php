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
        Schema::create('card_labels', function (Blueprint $table) {
            $table->uuid('card_label_id')->primary();

            $table->foreignUuid('card_label_project_id')
                ->constrained('projects', 'project_id')
                ->cascadeOnDelete();
            $table->foreignUuid('card_label_category_id')
                ->constrained('card_label_categories', 'card_label_category_id')
                ->cascadeOnDelete();
            $table->foreignUuid('card_label_color_id')
                ->constrained('card_label_colors', 'card_label_color_id')
                ->cascadeOnDelete();

            $table->string('card_label_name', 20);
            $table->timestamps();
            $table->unique(['card_label_project_id', 'card_label_color_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('card_labels');
    }
};
