<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->string('avatar_color', 30)->default('accent-blue')->after('project_slug');
            $table->string('avatar_url', 255)->nullable()->after('avatar_color');
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn(['avatar_color', 'avatar_url']);
        });
    }
};
