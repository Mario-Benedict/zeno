<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reminders', function (Blueprint $table) {
            $table->timestamp('notification_read_at')->nullable()->after('is_completed');
            $table->index(
                ['reminder_project_id', 'reminder_user_id', 'notification_read_at'],
                'reminders_notification_inbox_idx',
            );
        });
    }

    public function down(): void
    {
        Schema::table('reminders', function (Blueprint $table) {
            $table->dropIndex('reminders_notification_inbox_idx');
            $table->dropColumn('notification_read_at');
        });
    }
};
