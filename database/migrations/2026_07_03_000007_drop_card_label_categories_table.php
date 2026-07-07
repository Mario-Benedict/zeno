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
        Schema::dropIfExists('card_label_categories');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::create('card_label_categories', function (Blueprint $table) {
            $table->uuid('card_label_category_id')->primary();
            $table->string('card_label_category_name', 20);
            $table->timestamps();
        });
    }
};
