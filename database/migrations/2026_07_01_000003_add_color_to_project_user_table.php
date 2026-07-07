<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Add a per-project color to each membership so that Calendar events
 * can be visually distinguished by owner. Colors are drawn from the
 * existing accent palette in tailwind.config.js.
 */
return new class extends Migration
{
    /**
     * The accent palette from the Zeno design system.
     * Must stay in sync with tailwind.config.js → theme.extend.colors.accent.
     */
    private const ACCENT_COLORS = [
        '#FFB3B3', // red
        '#FFD1A1', // orange
        '#FFF0B3', // yellow
        '#DCEDC8', // lime
        '#B2DFDB', // green
        '#B3E5FC', // cyan
        '#C5CAE9', // blue
        '#E1BEE7', // purple
        '#F8BBD0', // pink
        '#D7CCC8', // brown
    ];

    public function up(): void
    {
        Schema::table('project_user', function (Blueprint $table) {
            $table->string('color', 7)->nullable()->after('role');
        });

        // Seed existing memberships with random unique-per-project colors.
        $rows = \Illuminate\Support\Facades\DB::table('project_user')
            ->orderBy('project_id')
            ->get(['project_id', 'user_id']);

        $grouped = $rows->groupBy('project_id');

        foreach ($grouped as $projectId => $members) {
            $available = self::ACCENT_COLORS;
            shuffle($available);

            foreach ($members as $i => $member) {
                $color = $available[$i % count($available)];

                \Illuminate\Support\Facades\DB::table('project_user')
                    ->where('project_id', $projectId)
                    ->where('user_id', $member->user_id)
                    ->update(['color' => $color]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('project_user', function (Blueprint $table) {
            $table->dropColumn('color');
        });
    }
};
