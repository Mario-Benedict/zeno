<?php

use App\Models\KanbanBoard;
use App\Models\KanbanBoardCard;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    /** @var mixed $this */
    $this->user = User::factory()->create();

    $this->project = Project::create([
        'project_name' => 'Project Zeno',
        'project_slug' => 'zeno',
    ]);
    $this->project->members()->attach($this->user->id, ['role' => 'OWNER']);

    $this->board = KanbanBoard::create([
        'kanban_board_project_id' => $this->project->project_id,
        'kanban_board_name' => 'To Do',
        'kanban_board_position' => 0,
    ]);
});

it('renders the kanban page with the flattened card shape', function () {
    /** @var mixed $this */
    KanbanBoardCard::create([
        'kanban_board_id' => $this->board->kanban_board_id,
        'position' => 0,
        'kanban_board_card_title' => 'Ship v1',
        'is_completed' => false,
    ]);

    $this->actingAs($this->user)
        ->get("/u/0/p/{$this->project->project_slug}/kanban")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('kanban')
            ->where('kanbanBoards.0.cards.0.kanban_board_card_title', 'Ship v1')
            ->where('kanbanBoards.0.cards.0.is_completed', false)
        );
});

it('denies access to non-members', function () {
    /** @var mixed $this */
    $outsider = User::factory()->create();

    $this->actingAs($outsider)
        ->get("/u/0/p/{$this->project->project_slug}/kanban")
        ->assertForbidden();
});
