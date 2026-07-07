<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * `card_label_categories` and `card_label_colors` were single-column
     * lookup tables only ever referenced by `card_labels`. The category
     * concept was never surfaced to users (every label silently got
     * category "General"), so it's dropped outright rather than inlined.
     * The color is inlined as a plain hex string, matching the existing
     * convention used for `projects.avatar_color`.
     *
     * SQLite refuses to drop a column that participates in a foreign key at
     * all, so it gets a drop-and-recreate branch instead (this table is
     * always empty when this migration runs). MySQL keeps the real ALTER
     * path.
     */
    public function up(): void
    {
        if (Schema::getConnection()->getDriverName() === 'sqlite') {
            Schema::dropIfExists('card_labels');
            Schema::create('card_labels', function (Blueprint $table) {
                $table->uuid('card_label_id')->primary();
                $table->foreignUuid('card_label_project_id')
                    ->constrained('projects', 'project_id')
                    ->cascadeOnDelete();
                $table->string('card_label_color_hex', 20);
                $table->string('card_label_name', 20);
                $table->timestamps();
                $table->unique(['card_label_project_id', 'card_label_color_hex']);
            });

            return;
        }

        // The old composite unique index (project_id, color_id) is also the
        // only index whose leftmost column is `card_label_project_id`, so it
        // silently doubles as the supporting index for the still-active
        // `card_label_project_id` foreign key. The replacement unique index
        // must exist *before* the old one is dropped, or MySQL refuses the
        // drop with "needed in a foreign key constraint".
        Schema::table('card_labels', function (Blueprint $table) {
            $table->string('card_label_color_hex', 20)->after('card_label_project_id');
        });

        Schema::table('card_labels', function (Blueprint $table) {
            $table->unique(['card_label_project_id', 'card_label_color_hex']);
        });

        Schema::table('card_labels', function (Blueprint $table) {
            $table->dropForeign(['card_label_category_id']);
            $table->dropForeign(['card_label_color_id']);
            $table->dropUnique(['card_label_project_id', 'card_label_color_id']);
            $table->dropColumn(['card_label_category_id', 'card_label_color_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Same ordering constraint as up(): the replacement (project_id,
        // color_id) unique index must exist before the (project_id,
        // color_hex) one is dropped, since it's the only supporting index
        // for the `card_label_project_id` foreign key.
        Schema::table('card_labels', function (Blueprint $table) {
            $table->foreignUuid('card_label_category_id')
                ->after('card_label_project_id')
                ->constrained('card_label_categories', 'card_label_category_id')
                ->cascadeOnDelete();
            $table->foreignUuid('card_label_color_id')
                ->after('card_label_category_id')
                ->constrained('card_label_colors', 'card_label_color_id')
                ->cascadeOnDelete();
        });

        Schema::table('card_labels', function (Blueprint $table) {
            $table->unique(['card_label_project_id', 'card_label_color_id']);
        });

        Schema::table('card_labels', function (Blueprint $table) {
            $table->dropUnique(['card_label_project_id', 'card_label_color_hex']);
            $table->dropColumn('card_label_color_hex');
        });
    }
};
