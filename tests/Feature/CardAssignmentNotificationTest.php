<?php

use App\Models\CardAssignmentNotice;
use App\Models\KanbanBoard;
use App\Models\KanbanBoardCard;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    /** @var mixed $this */
    $this->admin = User::factory()->create(['name' => 'Admin']);
    $this->assignee = User::factory()->create(['name' => 'Assignee']);

    $this->project = Project::create(['project_name' => 'Zeno', 'project_slug' => 'zeno-assign-notify']);
    $this->project->members()->attach($this->admin->id, ['role' => 'OWNER', 'color' => '#D7CCC8']);
    $this->project->members()->attach($this->assignee->id, ['role' => 'MEMBER', 'color' => '#F8BBD0']);

    $this->board = KanbanBoard::create([
        'kanban_board_project_id' => $this->project->project_id,
        'kanban_board_name' => 'To Do',
        'kanban_board_position' => 0,
    ]);

    $this->card = KanbanBoardCard::create([
        'kanban_board_id' => $this->board->kanban_board_id,
        'position' => 0,
        'kanban_board_card_title' => 'Ship the release',
        'is_completed' => false,
    ]);
});

it('creates a card assignment notice when a member is assigned, even without a due date', function () {
    /** @var mixed $this */
    $this->actingAs($this->admin)
        ->withSession(['accounts' => [['user_id' => $this->admin->id]], 'account_active_index' => 0])
        ->post("/u/0/p/{$this->project->project_slug}/cards/{$this->card->kanban_board_card_id}/members", [
            'user_id' => $this->assignee->id,
        ])
        ->assertRedirect();

    $notice = CardAssignmentNotice::where('kanban_board_card_id', $this->card->kanban_board_card_id)->first();

    expect($notice)->not->toBeNull();
    expect($notice->assignee_user_id)->toBe($this->assignee->id);
    expect($notice->assigned_by_user_id)->toBe($this->admin->id);
    expect($notice->read_at)->toBeNull();
});

it('does not create a notice when a member assigns themselves', function () {
    /** @var mixed $this */
    $this->actingAs($this->assignee)
        ->withSession(['accounts' => [['user_id' => $this->assignee->id]], 'account_active_index' => 0])
        ->post("/u/0/p/{$this->project->project_slug}/cards/{$this->card->kanban_board_card_id}/members", [
            'user_id' => $this->assignee->id,
        ])
        ->assertRedirect();

    expect(CardAssignmentNotice::where('kanban_board_card_id', $this->card->kanban_board_card_id)->exists())->toBeFalse();
});

it('surfaces an unread assignment notice in the notifications inbox', function () {
    /** @var mixed $this */
    $this->card->members()->attach($this->assignee->id);
    CardAssignmentNotice::create([
        'kanban_board_card_id' => $this->card->kanban_board_card_id,
        'assignee_user_id' => $this->assignee->id,
        'assigned_by_user_id' => $this->admin->id,
    ]);

    $response = $this->actingAs($this->assignee)
        ->withSession(['accounts' => [['user_id' => $this->assignee->id]], 'account_active_index' => 0])
        ->getJson("/u/0/p/{$this->project->project_slug}/notifications")
        ->assertOk();

    $item = collect($response->json('inbox'))->firstWhere('type', 'assignment');

    expect($item)->not->toBeNull();
    expect($item['card_title'])->toBe('Ship the release');
});

it('marks the notice read and redirects to the card on the board when opened', function () {
    /** @var mixed $this */
    $this->card->members()->attach($this->assignee->id);
    $notice = CardAssignmentNotice::create([
        'kanban_board_card_id' => $this->card->kanban_board_card_id,
        'assignee_user_id' => $this->assignee->id,
        'assigned_by_user_id' => $this->admin->id,
    ]);

    $response = $this->actingAs($this->assignee)
        ->withSession(['accounts' => [['user_id' => $this->assignee->id]], 'account_active_index' => 0])
        ->post("/u/0/p/{$this->project->project_slug}/notifications/assignments/{$notice->id}/open")
        ->assertRedirect();

    expect($response->headers->get('Location'))->toContain('card='.$this->card->kanban_board_card_id);

    $notice->refresh();
    expect($notice->read_at)->not->toBeNull();
});

it('rejects opening a notice belonging to someone else', function () {
    /** @var mixed $this */
    $notice = CardAssignmentNotice::create([
        'kanban_board_card_id' => $this->card->kanban_board_card_id,
        'assignee_user_id' => $this->assignee->id,
        'assigned_by_user_id' => $this->admin->id,
    ]);

    $this->actingAs($this->admin)
        ->withSession(['accounts' => [['user_id' => $this->admin->id]], 'account_active_index' => 0])
        ->post("/u/0/p/{$this->project->project_slug}/notifications/assignments/{$notice->id}/open")
        ->assertForbidden();
});
