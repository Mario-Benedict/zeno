<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // note_id sudah jadi primary key via phpMyAdmin, skip
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE notes DROP PRIMARY KEY');
    }
};