<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notes', function (Blueprint $table) {
            // An optimistic-lock revision prevents a stale browser from
            // silently replacing a collaborator's newer document snapshot.
            $table->unsignedBigInteger('version')->default(1)->after('content');
        });
    }

    public function down(): void
    {
        Schema::table('notes', function (Blueprint $table) {
            $table->dropColumn('version');
        });
    }
};
