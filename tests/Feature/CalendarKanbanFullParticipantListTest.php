<?php

use App\Models\KanbanBoard;
use App\Models\KanbanBoardCard;
use App\Models\Project;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('shows every assigned Kanban card member on the calendar, not just the ones checked in the member filter', function () {
    $mario = User::factory()->create(['name' => 'Mario']);
    $others = User::factory()->count(3)->create();

    $project = Project::create(['project_name' => 'Zeno', 'project_slug' => 'zeno-test']);
    $project->members()->attach($mario->id, ['role' => 'OWNER', 'color' => '#D7CCC8']);
    foreach ($others as $other) {
        $project->members()->attach($other->id, ['role' => 'MEMBER', 'color' => '#7B7B7B']);
    }

    $board = KanbanBoard::create([
        'kanban_board_project_id' => $project->project_id,
        'kanban_board_name' => 'To Do',
        'kanban_board_position' => 0,
    ]);

    $dueDate = CarbonImmutable::now('UTC')->addDays(5)->setTime(15, 0);

    $card = KanbanBoardCard::create([
        'kanban_board_id' => $board->kanban_board_id,
        'position' => 0,
        'kanban_board_card_title' => 'Assigned to everyone',
        'is_completed' => false,
        'kanban_board_card_due_date' => $dueDate,
    ]);
    // 4 assignees total: mario + the 3 others.
    $card->members()->attach([$mario->id, ...$others->pluck('id')->all()]);

    // Only mario is checked in the calendar's member filter — this is the
    // scenario that previously truncated the participant list to just him.
    $query = http_build_query([
        'start' => $dueDate->copy()->subDay()->toIso8601String(),
        'end' => $dueDate->copy()->addDay()->toIso8601String(),
        'users' => [$mario->id],
    ]);

    $response = $this->actingAs($mario)
        ->withSession(['accounts' => [['user_id' => $mario->id]], 'account_active_index' => 0])
        ->getJson("/u/0/p/{$project->project_slug}/calendar/events?{$query}")
        ->assertOk();

    $entries = collect($response->json());
    $task = $entries->firstWhere('kanban_board_card_id', $card->kanban_board_card_id);

    expect($task)->not->toBeNull();
    expect(collect($task['participants'])->pluck('id')->sort()->values()->all())
        ->toEqual(collect([$mario->id, ...$others->pluck('id')->all()])->sort()->values()->all());
});
