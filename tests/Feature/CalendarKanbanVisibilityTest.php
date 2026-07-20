<?php

use App\Models\KanbanBoard;
use App\Models\KanbanBoardCard;
use App\Models\Project;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/**
 * Two projects: Zeno (viewer's project) and Atlas (owns the Kanban card
 * under test). Both users are in Zeno so the assignee is a valid member-filter
 * target. The card belongs to Atlas, so it still goes through
 * CalendarService::getClassifiedKanbanTasks()'s cross-project branch.
 */
function seedKanbanVisibilityScenario(string $assigneeVisibility): array
{
    $assignee = User::factory()->create(['name' => 'Assignee', 'calendar_visibility' => $assigneeVisibility]);
    $viewer = User::factory()->create(['name' => 'Viewer']);

    $zeno = Project::create(['project_name' => 'Zeno', 'project_slug' => 'zeno-kanban-vis']);
    $zeno->members()->attach($viewer->id, ['role' => 'OWNER', 'color' => '#D7CCC8']);
    $zeno->members()->attach($assignee->id, ['role' => 'MEMBER', 'color' => '#7B7B7B']);

    $atlas = Project::create(['project_name' => 'Atlas', 'project_slug' => 'atlas-kanban-vis']);
    $atlas->members()->attach($assignee->id, ['role' => 'OWNER', 'color' => '#D7CCC8']);
    $atlas->members()->attach($viewer->id, ['role' => 'MEMBER', 'color' => '#F8BBD0']);

    $board = KanbanBoard::create([
        'kanban_board_project_id' => $atlas->project_id,
        'kanban_board_name' => 'Backlog',
        'kanban_board_position' => 0,
    ]);

    $dueDate = CarbonImmutable::now('UTC')->addDay()->setTime(9, 0);

    $card = KanbanBoardCard::create([
        'kanban_board_id' => $board->kanban_board_id,
        'position' => 0,
        'kanban_board_card_title' => 'Confidential deliverable',
        'is_completed' => false,
        'kanban_board_card_due_date' => $dueDate,
    ]);
    $card->members()->attach($assignee->id);

    return compact('assignee', 'viewer', 'zeno', 'atlas', 'card', 'dueDate');
}

function fetchClassifiedKanbanEntry(User $viewer, Project $zeno, array $userIds, CarbonImmutable $dueDate)
{
    $query = http_build_query([
        'start' => $dueDate->copy()->subDay()->toIso8601String(),
        'end' => $dueDate->copy()->addDays(2)->toIso8601String(),
        'users' => $userIds,
    ]);

    $response = test()->actingAs($viewer)
        ->withSession(['accounts' => [['user_id' => $viewer->id]], 'account_active_index' => 0])
        ->getJson("/u/0/p/{$zeno->project_slug}/calendar/events?{$query}")
        ->assertOk();

    return collect($response->json())->first(
        fn ($e) => str_contains((string) $e['id'], 'kanban')
    );
}

it('shows full task details when the assignee is transparent', function () {
    ['assignee' => $assignee, 'viewer' => $viewer, 'zeno' => $zeno, 'dueDate' => $dueDate] = seedKanbanVisibilityScenario('transparent');

    $entry = fetchClassifiedKanbanEntry($viewer, $zeno, [$assignee->id], $dueDate);

    expect($entry)->not->toBeNull();
    expect($entry['title'])->toBe('Confidential deliverable');
    expect($entry['is_classified'] ?? false)->toBeFalse();
    expect($entry['is_kanban_task'] ?? false)->toBeTrue();
});

it('hides the title but keeps real times when the assignee is masked', function () {
    ['assignee' => $assignee, 'viewer' => $viewer, 'zeno' => $zeno, 'dueDate' => $dueDate] = seedKanbanVisibilityScenario('masked');

    $entry = fetchClassifiedKanbanEntry($viewer, $zeno, [$assignee->id], $dueDate);

    expect($entry)->not->toBeNull();
    expect($entry)->not->toHaveKey('title');
    expect($entry['is_classified'])->toBeTrue();
    expect($entry['is_kanban_task'])->toBeTrue();
    expect($entry['visibility'])->toBe('masked');
    expect($entry['start_time'])->toStartWith($dueDate->toIso8601String());
});

it('strips everything but a busy block when the assignee is busy_only', function () {
    ['assignee' => $assignee, 'viewer' => $viewer, 'zeno' => $zeno, 'dueDate' => $dueDate] = seedKanbanVisibilityScenario('busy_only');

    $entry = fetchClassifiedKanbanEntry($viewer, $zeno, [$assignee->id], $dueDate);

    expect($entry)->not->toBeNull();
    expect($entry)->not->toHaveKey('title');
    expect($entry['is_classified'])->toBeTrue();
    expect($entry['visibility'])->toBe('busy_only');
});
