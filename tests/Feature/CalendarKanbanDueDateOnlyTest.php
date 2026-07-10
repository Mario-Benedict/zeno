<?php

use App\Models\KanbanBoard;
use App\Models\KanbanBoardCard;
use App\Models\Project;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('projects an assigned Kanban card onto the calendar using only its due date, not its start date', function () {
    $mario = User::factory()->create(['name' => 'Mario']);

    $project = Project::create(['project_name' => 'Zeno', 'project_slug' => 'zeno-test']);
    $project->members()->attach($mario->id, ['role' => 'OWNER', 'color' => '#D7CCC8']);

    $board = KanbanBoard::create([
        'kanban_board_project_id' => $project->project_id,
        'kanban_board_name' => 'To Do',
        'kanban_board_position' => 0,
    ]);

    $startDate = CarbonImmutable::now('UTC')->addDay()->setTime(9, 0);
    $dueDate = CarbonImmutable::now('UTC')->addDays(5)->setTime(15, 0);

    $card = KanbanBoardCard::create([
        'kanban_board_id' => $board->kanban_board_id,
        'position' => 0,
        'kanban_board_card_title' => 'Ship the release notes',
        'is_completed' => false,
        'kanban_board_card_start_date' => $startDate,
        'kanban_board_card_due_date' => $dueDate,
    ]);
    $card->members()->attach($mario->id);

    $query = http_build_query([
        'start' => $startDate->copy()->subDay()->toIso8601String(),
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
    expect($task['start_time'])->toStartWith($dueDate->toIso8601String());
    expect(CarbonImmutable::parse($task['end_time']))
        ->toEqual($dueDate->addHour());
});

it('does not show a Kanban card on the calendar when it only has a start date, no due date', function () {
    $mario = User::factory()->create(['name' => 'Mario']);

    $project = Project::create(['project_name' => 'Zeno', 'project_slug' => 'zeno-test']);
    $project->members()->attach($mario->id, ['role' => 'OWNER', 'color' => '#D7CCC8']);

    $board = KanbanBoard::create([
        'kanban_board_project_id' => $project->project_id,
        'kanban_board_name' => 'To Do',
        'kanban_board_position' => 0,
    ]);

    $startDate = CarbonImmutable::now('UTC')->addDay()->setTime(9, 0);

    $card = KanbanBoardCard::create([
        'kanban_board_id' => $board->kanban_board_id,
        'position' => 0,
        'kanban_board_card_title' => 'Only a start date',
        'is_completed' => false,
        'kanban_board_card_start_date' => $startDate,
    ]);
    $card->members()->attach($mario->id);

    $query = http_build_query([
        'start' => $startDate->copy()->subDay()->toIso8601String(),
        'end' => $startDate->copy()->addDays(3)->toIso8601String(),
        'users' => [$mario->id],
    ]);

    $response = $this->actingAs($mario)
        ->withSession(['accounts' => [['user_id' => $mario->id]], 'account_active_index' => 0])
        ->getJson("/u/0/p/{$project->project_slug}/calendar/events?{$query}")
        ->assertOk();

    $entries = collect($response->json());

    expect($entries->firstWhere('kanban_board_card_id', $card->kanban_board_card_id))->toBeNull();
});
