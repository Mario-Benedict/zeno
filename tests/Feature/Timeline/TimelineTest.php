<?php

use App\Models\KanbanBoard;
use App\Models\KanbanBoardCard;
use App\Models\KanbanBoardCardDate;
use App\Models\KanbanBoardCardDetail;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    /** @var mixed $this */
    // Stub the Vite manifest so these feature tests never depend on a
    // production `npm run build` being present.
    $this->withoutVite();

    $this->user1 = User::factory()->create(['name' => 'Mario']);
    $this->user2 = User::factory()->create(['name' => 'Evan']);
    $this->outsider = User::factory()->create(['name' => 'Intruder']);

    $this->project = Project::create([
        'project_name' => 'Project Zeno',
        'project_slug' => 'zeno',
    ]);

    $this->project->members()->attach($this->user1->id);
    $this->project->members()->attach($this->user2->id);
});

/**
 * Seed a scheduled task (board → card → detail → dates) and return the card.
 */
function scheduleTask(
    Project $project,
    string $title,
    ?string $start,
    ?string $due,
): KanbanBoardCard {
    $board = KanbanBoard::create([
        'kanban_board_project_id' => $project->project_id,
        'kanban_board_name' => 'To Do',
        'kanban_board_position' => 0,
    ]);

    $card = KanbanBoardCard::create([
        'kanban_board_id' => $board->kanban_board_id,
        'position' => 0,
    ]);

    $detail = KanbanBoardCardDetail::create([
        'kanban_board_card_id' => $card->kanban_board_card_id,
        'kanban_board_card_title' => $title,
        'is_completed' => false,
    ]);

    KanbanBoardCardDate::create([
        'kanban_board_card_detail_id' => $detail->kanban_board_card_detail_id,
        'kanban_board_card_start_date' => $start,
        'kanban_board_card_due_date' => $due,
    ]);

    return $card;
}

it('renders the timeline page with the reused kanban payload', function () {
    /** @var mixed $this */
    scheduleTask($this->project, 'Kanban Board UI', '2026-04-20', '2026-04-24');

    $this->actingAs($this->user1)
        ->get("/u/0/p/{$this->project->project_slug}/timeline")
        ->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('timeline')
            ->has('kanbanBoards', 1)
            ->has('kanbanBoards.0.cards', 1)
            ->has('cardLabels')
            ->has('projectUsers', 2)
            ->where('currentUser.id', $this->user1->id)
        );
});

it('exposes each scheduled task\'s start and due dates for the bars', function () {
    /** @var mixed $this */
    scheduleTask($this->project, 'Fix Login Page Bug', '2026-04-27', '2026-04-30');

    $this->actingAs($this->user1)
        ->get("/u/0/p/{$this->project->project_slug}/timeline")
        ->assertInertia(fn ($page) => $page
            ->component('timeline')
            ->has('kanbanBoards.0.cards.0.detail.dates', fn ($dates) => $dates
                ->where('kanban_board_card_start_date', fn ($d) => str_contains((string) $d, '2026-04-27'))
                ->where('kanban_board_card_due_date', fn ($d) => str_contains((string) $d, '2026-04-30'))
                ->etc()
            )
        );
});

it('forbids a non-member from opening the project timeline', function () {
    /** @var mixed $this */
    $this->actingAs($this->outsider)
        ->get("/u/0/p/{$this->project->project_slug}/timeline")
        ->assertForbidden();
});

it('still renders for a project that has no scheduled tasks', function () {
    /** @var mixed $this */
    $this->actingAs($this->user1)
        ->get("/u/0/p/{$this->project->project_slug}/timeline")
        ->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('timeline')
            ->has('kanbanBoards', 0)
        );
});
