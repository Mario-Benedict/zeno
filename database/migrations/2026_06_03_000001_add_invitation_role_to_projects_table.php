<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table
                ->enum('invitation_role', ['ADMIN', 'MEMBER', 'VIEWER'])
                ->default('MEMBER')
                ->after('invitation_link');
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn('invitation_role');
        });
    }
};
