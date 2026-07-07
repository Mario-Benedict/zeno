<?php

namespace Database\Seeders;

use App\Models\CalendarEvent;
use App\Models\Project;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Reproduces the "Project Zeno" calendar scenario from the design mockups:
 * a busy multi-member project plus a second project ("Project Atlas") that
 * generates cross-project CLASSIFIED busy-blocks.
 *
 * Run with:  php artisan db:seed --class=CalendarDemoSeeder
 *
 * All demo accounts use the password: "password".
 */
class CalendarDemoSeeder extends Seeder
{
    /**
     * name => [email, light-accent colour]. The colours are picked to match
     * the reference mockup and are drawn from tailwind accent.*.light tokens.
     */
    private const MEMBERS = [
        'Mario'  => ['mario@zeno.test',  '#D7CCC8'],
        'Kevin'  => ['kevin@zeno.test',  '#F8BBD0'],
        'Rachma' => ['rachma@zeno.test', '#FFD1A1'],
        'Evan'   => ['evan@zeno.test',   '#FFF0B3'],
        'Abel'   => ['abel@zeno.test',   '#DCEDC8'],
        'Jin'    => ['jin@zeno.test',    '#B3E5FC'],
        'Kazuya' => ['kazuya@zeno.test', '#C5CAE9'],
        'Xiaoyu' => ['xiaoyu@zeno.test', '#E1BEE7'],
        'Alisa'  => ['alisa@zeno.test',  '#F8BBD0'],
        'Eddy'   => ['eddy@zeno.test',   '#E0E0E0'],
        'Raven'  => ['raven@zeno.test',  '#B2DFDB'],
        'Victor' => ['victor@zeno.test', '#D7CCC8'],
    ];

    /**
     * If a user with this email already exists, they become the demo "Abel"
     * so the person running the app can view the scenario as themselves.
     */
    private const REAL_ABEL_EMAIL = 'abelmahotama@gmail.com';

    public function run(): void
    {
        /** @var array<string, User> $users */
        $users = [];
        foreach (self::MEMBERS as $name => [$email, $color]) {
            if ($name === 'Abel') {
                $existing = User::where('email', self::REAL_ABEL_EMAIL)->first();
                if ($existing) {
                    $users[$name] = $existing;
                    continue;
                }
            }

            $users[$name] = User::updateOrCreate(
                ['email' => $email],
                [
                    'name' => $name,
                    'password' => Hash::make('password'),
                    'email_verified_at' => now(),
                ],
            );
        }

        // --- Project Zeno: the project being viewed --------------------------
        $zeno = Project::firstOrCreate(
            ['project_slug' => 'project-zeno'],
            ['project_name' => 'Project Zeno', 'avatar_color' => '#3949AB'],
        );

        foreach (self::MEMBERS as $name => [, $color]) {
            $role = $name === 'Mario' ? 'OWNER' : ($name === 'Abel' ? 'ADMIN' : 'MEMBER');
            $this->syncMembership($zeno, $users[$name], $role, $color);
        }

        // --- Project Atlas: source of cross-project CLASSIFIED blocks --------
        $atlas = Project::firstOrCreate(
            ['project_slug' => 'project-atlas'],
            ['project_name' => 'Project Atlas', 'avatar_color' => '#00897B'],
        );
        $this->syncMembership($atlas, $users['Mario'], 'OWNER', '#D7CCC8');
        $this->syncMembership($atlas, $users['Abel'], 'MEMBER', '#DCEDC8');

        // Clear any previous demo events so the seeder is repeatable.
        CalendarEvent::whereIn('project_id', [$zeno->project_id, $atlas->project_id])->delete();

        // Anchor everything to the current week/month so it is visible on load.
        $weekStart = Carbon::now('UTC')->startOfWeek(Carbon::SUNDAY)->startOfDay();
        $monthStart = Carbon::now('UTC')->startOfMonth();

        $at = fn (Carbon $base, int $addDays, int $h, int $m) => $base->copy()->addDays($addDays)->setTime($h, $m);

        // ---- Week-view highlights (current week) ----------------------------
        // Work A — Mario, Tuesday early morning (low priority)
        $this->event($zeno, $users['Mario'], 'Work A', 'low',
            $at($weekStart, 2, 1, 0), $at($weekStart, 2, 5, 15));

        // Work B — Rachma, Saturday early morning (low priority)
        $this->event($zeno, $users['Rachma'], 'Work B', 'low',
            $at($weekStart, 6, 2, 30), $at($weekStart, 6, 6, 15));

        // ---- Cross-project events in Atlas -> render as CLASSIFIED in Zeno ---
        $this->event($atlas, $users['Mario'], 'Review Kontrak Klien X', 'high',
            $at($weekStart, 2, 9, 30), $at($weekStart, 2, 12, 0));

        $this->event($atlas, $users['Abel'], 'Field Recon', 'mid',
            $at($weekStart, 6, 6, 30), $at($weekStart, 6, 9, 0));

        // ---- Month-view population (first of the month, many people) --------
        $day1 = [
            ['Abel', 'Standup', 'low', 10, 0, 10, 45],
            ['Evan', 'Design Sync', 'mid', 15, 30, 16, 30],
            ['Rachma', 'Client Call', 'high', 21, 0, 22, 0],
            ['Kevin', 'Deploy', 'mid', 22, 15, 23, 0],
            ['Rachma', 'Retro', 'high', 23, 30, 23, 59],
            ['Mario', 'Planning', 'mid', 8, 0, 9, 0],
            ['Kevin', 'Review', 'low', 12, 0, 12, 45],
            ['Jin', '1:1', 'low', 13, 30, 14, 0],
        ];
        foreach ($day1 as [$who, $title, $prio, $sh, $sm, $eh, $em]) {
            $this->event($zeno, $users[$who], $title, $prio,
                $monthStart->copy()->setTime($sh, $sm), $monthStart->copy()->setTime($eh, $em));
        }

        // A scattering of events across the rest of the month.
        $scatter = [
            [10, 'Abel', 'Workshop', 'low', 10, 0, 11, 30],
            [10, 'Evan', 'Interview', 'mid', 15, 30, 16, 15],
            [13, 'Rachma', 'Demo', 'high', 21, 0, 22, 0],
            [13, 'Kevin', 'Pairing', 'mid', 22, 15, 23, 0],
            [22, 'Mario', 'Sync', 'mid', 0, 30, 1, 30],
            [22, 'Abel', 'Report', 'high', 9, 0, 10, 0],
        ];
        foreach ($scatter as [$dow, $who, $title, $prio, $sh, $sm, $eh, $em]) {
            $day = $monthStart->copy()->addDays($dow);
            $this->event($zeno, $users[$who], $title, $prio,
                $day->copy()->setTime($sh, $sm), $day->copy()->setTime($eh, $em));
        }

        // ---- A weekly recurring event to demonstrate recurrence ------------
        $this->event($zeno, $users['Evan'], 'Weekly Sync', 'mid',
            $weekStart->copy()->setTime(17, 0), $weekStart->copy()->setTime(18, 0), 'weekly');

        $this->command?->info('Calendar demo seeded. Log in as mario@zeno.test / password, open "Project Zeno".');
    }

    private function syncMembership(Project $project, User $user, string $role, string $color): void
    {
        $exists = DB::table('project_user')
            ->where('project_id', $project->project_id)
            ->where('user_id', $user->id)
            ->exists();

        if ($exists) {
            DB::table('project_user')
                ->where('project_id', $project->project_id)
                ->where('user_id', $user->id)
                ->update(['role' => $role, 'color' => $color]);
        } else {
            $project->members()->attach($user->id, [
                'role' => $role,
                'color' => $color,
                'opened_at' => now(),
            ]);
        }
    }

    private function event(
        Project $project,
        User $owner,
        string $title,
        string $priority,
        Carbon $start,
        Carbon $end,
        string $recurrence = 'none',
    ): CalendarEvent {
        $event = new CalendarEvent();
        $event->id = Str::uuid()->toString();
        $event->project_id = $project->project_id;
        $event->title = $title;
        $event->description = 'Seeded demo event.';
        $event->start_time = $start;
        $event->end_time = $end;
        $event->priority = $priority;
        $event->created_by = $owner->id;
        $event->recurrence = $recurrence;
        if ($recurrence === 'weekly') {
            $event->recurrence_group_id = Str::uuid()->toString();
        }
        $event->save();
        $event->participants()->sync([$owner->id]);

        return $event;
    }
}
