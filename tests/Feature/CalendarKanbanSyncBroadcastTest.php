<?php

use App\Events\CalendarEventChanged;
use App\Models\KanbanBoard;
use App\Models\KanbanBoardCard;
use App\Models\Project;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;

uses(RefreshDatabase::class);

beforeEach(function () {
    /** @var mixed $this */
    $this->owner = User::factory()->create();
    $this->member = User::factory()->create();

    $this->project = Project::create([
        'project_name' => 'Project Zeno',
        'project_slug' => 'zeno',
    ]);
    $this->project->members()->attach($this->owner->id, ['role' => 'OWNER']);
    $this->project->members()->attach($this->member->id, ['role' => 'MEMBER']);

    $this->board = KanbanBoard::create([
        'kanban_board_project_id' => $this->project->project_id,
        'kanban_board_name' => 'To Do',
        'kanban_board_position' => 0,
    ]);
});

function kanbanCardSyncUrl(Project $project, string $path): string
{
    return "/u/0/p/{$project->project_slug}/{$path}";
}

it('broadcasts a calendar update when a member is added to a due-dated card', function () {
    /** @var mixed $this */
    Event::fake([CalendarEventChanged::class]);

    $card = KanbanBoardCard::create([
        'kanban_board_id' => $this->board->kanban_board_id,
        'position' => 0,
        'kanban_board_card_title' => 'Ship v1',
        'is_completed' => false,
        'kanban_board_card_due_date' => CarbonImmutable::now('UTC')->addDay(),
    ]);

    $this->actingAs($this->owner)
        ->post(kanbanCardSyncUrl($this->project, "cards/{$card->kanban_board_card_id}/members"), [
            'user_id' => $this->member->id,
        ])
        ->assertRedirect();

    Event::assertDispatched(
        CalendarEventChanged::class,
        fn (CalendarEventChanged $event) => $event->projectId === $this->project->project_id
            && in_array($this->member->id, $event->participantIds, true)
    );
});

it('does not broadcast a calendar update when a member is added to a card with no due date', function () {
    /** @var mixed $this */
    Event::fake([CalendarEventChanged::class]);

    $card = KanbanBoardCard::create([
        'kanban_board_id' => $this->board->kanban_board_id,
        'position' => 0,
        'kanban_board_card_title' => 'Ship v1',
        'is_completed' => false,
    ]);

    $this->actingAs($this->owner)
        ->post(kanbanCardSyncUrl($this->project, "cards/{$card->kanban_board_card_id}/members"), [
            'user_id' => $this->member->id,
        ])
        ->assertRedirect();

    Event::assertNotDispatched(CalendarEventChanged::class);
});

it('broadcasts a calendar update when a member is removed from a due-dated card', function () {
    /** @var mixed $this */
    $card = KanbanBoardCard::create([
        'kanban_board_id' => $this->board->kanban_board_id,
        'position' => 0,
        'kanban_board_card_title' => 'Ship v1',
        'is_completed' => false,
        'kanban_board_card_due_date' => CarbonImmutable::now('UTC')->addDay(),
    ]);
    $card->members()->attach($this->member->id);

    Event::fake([CalendarEventChanged::class]);

    $this->actingAs($this->owner)
        ->delete(kanbanCardSyncUrl($this->project, "cards/{$card->kanban_board_card_id}/members/{$this->member->id}"))
        ->assertRedirect();

    Event::assertDispatched(
        CalendarEventChanged::class,
        fn (CalendarEventChanged $event) => $event->projectId === $this->project->project_id
            && in_array($this->member->id, $event->participantIds, true)
    );
});

it('broadcasts a calendar update when a card due date is set, changed, or cleared', function () {
    /** @var mixed $this */
    Event::fake([CalendarEventChanged::class]);

    $card = KanbanBoardCard::create([
        'kanban_board_id' => $this->board->kanban_board_id,
        'position' => 0,
        'kanban_board_card_title' => 'Ship v1',
        'is_completed' => false,
    ]);

    $this->actingAs($this->owner)
        ->patch(kanbanCardSyncUrl($this->project, "cards/{$card->kanban_board_card_id}/dates"), [
            'kanban_board_card_due_date' => CarbonImmutable::now('UTC')->addDays(2)->toIso8601String(),
        ])
        ->assertRedirect();

    Event::assertDispatched(CalendarEventChanged::class, 1);

    $this->actingAs($this->owner)
        ->patch(kanbanCardSyncUrl($this->project, "cards/{$card->kanban_board_card_id}/dates"), [
            'kanban_board_card_due_date' => '',
        ])
        ->assertRedirect();

    Event::assertDispatched(CalendarEventChanged::class, 2);
});

it('does not broadcast a calendar update when only the start date changes', function () {
    /** @var mixed $this */
    $card = KanbanBoardCard::create([
        'kanban_board_id' => $this->board->kanban_board_id,
        'position' => 0,
        'kanban_board_card_title' => 'Ship v1',
        'is_completed' => false,
    ]);

    Event::fake([CalendarEventChanged::class]);

    $this->actingAs($this->owner)
        ->patch(kanbanCardSyncUrl($this->project, "cards/{$card->kanban_board_card_id}/dates"), [
            'kanban_board_card_start_date' => CarbonImmutable::now('UTC')->toIso8601String(),
        ])
        ->assertRedirect();

    Event::assertNotDispatched(CalendarEventChanged::class);
});
