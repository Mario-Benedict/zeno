<?php

use App\Models\CardAssignmentNotice;
use App\Models\ChatRoom;
use App\Models\KanbanBoard;
use App\Models\KanbanBoardCard;
use App\Models\Project;
use App\Models\Reminder;
use App\Models\TaskConflict;
use App\Models\User;
use App\Services\ChatMessageService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

beforeEach(function () {
    /** @var mixed $this */
    $this->user = User::factory()->create();
    $this->other = User::factory()->create();

    $this->quietProject = Project::create(['project_name' => 'Quiet', 'project_slug' => 'quiet-status']);
    $this->quietProject->members()->attach($this->user->id, ['role' => 'OWNER']);

    $this->busyProject = Project::create(['project_name' => 'Busy', 'project_slug' => 'busy-status']);
    $this->busyProject->members()->attach($this->user->id, ['role' => 'OWNER']);
    $this->busyProject->members()->attach($this->other->id, ['role' => 'MEMBER']);

    $this->board = KanbanBoard::create([
        'kanban_board_project_id' => $this->busyProject->project_id,
        'kanban_board_name' => 'To Do',
        'kanban_board_position' => 0,
    ]);

    $this->card = KanbanBoardCard::create([
        'kanban_board_id' => $this->board->kanban_board_id,
        'position' => 0,
        'kanban_board_card_title' => 'Ship it',
        'is_completed' => false,
    ]);

    // ChatMessageService's constructor connects to MongoDB, which isn't
    // configured in the local test environment (see the other Mongo-backed
    // suites) — mocked by default here so the SQL-only assertions below can
    // run without it; the chat-specific test overrides this.
    $this->mock(ChatMessageService::class, function ($mock) {
        $mock->shouldReceive('countUnread')->andReturn(0);
    });
});

function fetchNotificationStatus(User $user, array $projectIds)
{
    $query = http_build_query(['project_ids' => $projectIds]);

    return test()->actingAs($user)
        ->withSession(['accounts' => [['user_id' => $user->id]], 'account_active_index' => 0])
        ->getJson("/u/0/projects/notification-status?{$query}")
        ->assertOk();
}

it('reports false for a project with nothing pending', function () {
    /** @var mixed $this */
    $response = fetchNotificationStatus($this->user, [$this->quietProject->project_id, $this->busyProject->project_id]);

    $response->assertJsonPath($this->quietProject->project_id, false);
    $response->assertJsonPath($this->busyProject->project_id, false);
});

it('reports true when the user has a due-or-overdue reminder in that project', function () {
    /** @var mixed $this */
    Reminder::create([
        'reminder_project_id' => $this->busyProject->project_id,
        'reminder_user_id' => $this->user->id,
        'reminder_title' => 'Overdue task',
        'reminder_due_at' => now()->subDay(),
        'source' => 'manual',
    ]);

    $response = fetchNotificationStatus($this->user, [$this->quietProject->project_id, $this->busyProject->project_id]);

    $response->assertJsonPath($this->quietProject->project_id, false);
    $response->assertJsonPath($this->busyProject->project_id, true);
});

it('reports true when the user has an unread card assignment notice in that project', function () {
    /** @var mixed $this */
    CardAssignmentNotice::create([
        'kanban_board_card_id' => $this->card->kanban_board_card_id,
        'assignee_user_id' => $this->user->id,
        'assigned_by_user_id' => $this->other->id,
    ]);

    $response = fetchNotificationStatus($this->user, [$this->busyProject->project_id]);

    $response->assertJsonPath($this->busyProject->project_id, true);
});

it('reports true when the user has a pending task conflict awaiting their response', function () {
    /** @var mixed $this */
    TaskConflict::create([
        'kanban_board_card_id' => $this->card->kanban_board_card_id,
        'assignee_user_id' => $this->user->id,
        'assigned_by_user_id' => $this->other->id,
        'conflicting_title' => 'Client sync',
        'conflicting_start' => now(),
        'conflicting_end' => now()->addHour(),
        'status' => 'pending',
    ]);

    $response = fetchNotificationStatus($this->user, [$this->busyProject->project_id]);

    $response->assertJsonPath($this->busyProject->project_id, true);
});

it('reports true when the user has an undismissed decline alert as the assigner', function () {
    /** @var mixed $this */
    TaskConflict::create([
        'kanban_board_card_id' => $this->card->kanban_board_card_id,
        'assignee_user_id' => $this->other->id,
        'assigned_by_user_id' => $this->user->id,
        'conflicting_title' => 'Client sync',
        'conflicting_start' => now(),
        'conflicting_end' => now()->addHour(),
        'status' => 'declined',
        'assignee_acknowledged_at' => now(),
    ]);

    $response = fetchNotificationStatus($this->user, [$this->busyProject->project_id]);

    $response->assertJsonPath($this->busyProject->project_id, true);
});

it('reports true when the user has unread chat messages in that project', function () {
    /** @var mixed $this */
    $room = ChatRoom::create([
        'id' => (string) Str::uuid(),
        'project_id' => $this->busyProject->project_id,
        'type' => 'group',
        'name' => 'General',
    ]);
    $room->participants()->attach($this->user->id, ['role' => 'member', 'joined_at' => now()]);

    // Overrides the beforeEach default (0) for this room specifically.
    $this->mock(ChatMessageService::class, function ($mock) {
        $mock->shouldReceive('countUnread')->andReturn(2);
    });

    $response = fetchNotificationStatus($this->user, [$this->busyProject->project_id]);

    $response->assertJsonPath($this->busyProject->project_id, true);
});

it('ignores a project id the user is not a member of', function () {
    /** @var mixed $this */
    $foreignProject = Project::create(['project_name' => 'Foreign', 'project_slug' => 'foreign-status']);
    $foreignProject->members()->attach($this->other->id, ['role' => 'OWNER']);

    Reminder::create([
        'reminder_project_id' => $foreignProject->project_id,
        'reminder_user_id' => $this->other->id,
        'reminder_title' => 'Not yours',
        'reminder_due_at' => now()->subDay(),
        'source' => 'manual',
    ]);

    $response = fetchNotificationStatus($this->user, [$foreignProject->project_id]);

    $response->assertJson([]);
});
