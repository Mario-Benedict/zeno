<?php

use App\Models\KanbanBoard;
use App\Models\KanbanBoardCard;
use App\Models\Project;
use App\Models\Reminder;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

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

    $this->card = KanbanBoardCard::create([
        'kanban_board_id' => $this->board->kanban_board_id,
        'position' => 0,
        'kanban_board_card_title' => 'Ship v1',
        'is_completed' => false,
    ]);
});

function kanbanSyncUrl(Project $project, string $path): string
{
    return "/u/0/p/{$project->project_slug}/{$path}";
}

it('creates no reminder until a member is assigned, even with a due date', function () {
    /** @var mixed $this */
    $this->actingAs($this->owner)
        ->patch(kanbanSyncUrl($this->project, "cards/{$this->card->kanban_board_card_id}/dates"), [
            'kanban_board_card_due_date' => '2026-09-01',
        ])
        ->assertRedirect();

    $this->assertDatabaseCount('reminders', 0);
});

it('creates a reminder for each assigned member once a due date is set', function () {
    /** @var mixed $this */
    $this->actingAs($this->owner)
        ->post(kanbanSyncUrl($this->project, "cards/{$this->card->kanban_board_card_id}/members"), [
            'user_id' => $this->member->id,
        ])
        ->assertRedirect();

    $this->actingAs($this->owner)
        ->patch(kanbanSyncUrl($this->project, "cards/{$this->card->kanban_board_card_id}/dates"), [
            'kanban_board_card_due_date' => '2026-09-01',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('reminders', [
        'kanban_board_card_id' => $this->card->kanban_board_card_id,
        'reminder_user_id' => $this->member->id,
        'reminder_title' => 'Ship v1',
        'source' => 'kanban',
    ]);
});

it('assigning a member to a card that already has a due date creates their reminder', function () {
    /** @var mixed $this */
    $this->actingAs($this->owner)
        ->patch(kanbanSyncUrl($this->project, "cards/{$this->card->kanban_board_card_id}/dates"), [
            'kanban_board_card_due_date' => '2026-09-01',
        ]);

    $this->actingAs($this->owner)
        ->post(kanbanSyncUrl($this->project, "cards/{$this->card->kanban_board_card_id}/members"), [
            'user_id' => $this->member->id,
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('reminders', [
        'kanban_board_card_id' => $this->card->kanban_board_card_id,
        'reminder_user_id' => $this->member->id,
        'source' => 'kanban',
    ]);
});

it('updates the reminder title when the card title changes', function () {
    /** @var mixed $this */
    $this->actingAs($this->owner)
        ->post(kanbanSyncUrl($this->project, "cards/{$this->card->kanban_board_card_id}/members"), [
            'user_id' => $this->member->id,
        ]);
    $this->actingAs($this->owner)
        ->patch(kanbanSyncUrl($this->project, "cards/{$this->card->kanban_board_card_id}/dates"), [
            'kanban_board_card_due_date' => '2026-09-01',
        ]);

    $this->actingAs($this->owner)
        ->patch(kanbanSyncUrl($this->project, "cards/{$this->card->kanban_board_card_id}/detail"), [
            'kanban_board_card_title' => 'Ship v2',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('reminders', [
        'kanban_board_card_id' => $this->card->kanban_board_card_id,
        'reminder_user_id' => $this->member->id,
        'reminder_title' => 'Ship v2',
    ]);
});

it('removes a member\'s reminder when they are unassigned from the card', function () {
    /** @var mixed $this */
    $this->actingAs($this->owner)
        ->post(kanbanSyncUrl($this->project, "cards/{$this->card->kanban_board_card_id}/members"), [
            'user_id' => $this->member->id,
        ]);
    $this->actingAs($this->owner)
        ->patch(kanbanSyncUrl($this->project, "cards/{$this->card->kanban_board_card_id}/dates"), [
            'kanban_board_card_due_date' => '2026-09-01',
        ]);

    $this->actingAs($this->owner)
        ->delete(kanbanSyncUrl($this->project, "cards/{$this->card->kanban_board_card_id}/members/{$this->member->id}"))
        ->assertRedirect();

    $this->assertDatabaseMissing('reminders', [
        'kanban_board_card_id' => $this->card->kanban_board_card_id,
        'reminder_user_id' => $this->member->id,
    ]);
});

it('clearing the due date removes kanban-sourced reminders', function () {
    /** @var mixed $this */
    $this->actingAs($this->owner)
        ->post(kanbanSyncUrl($this->project, "cards/{$this->card->kanban_board_card_id}/members"), [
            'user_id' => $this->member->id,
        ]);
    $this->actingAs($this->owner)
        ->patch(kanbanSyncUrl($this->project, "cards/{$this->card->kanban_board_card_id}/dates"), [
            'kanban_board_card_due_date' => '2026-09-01',
        ]);

    $this->assertDatabaseCount('reminders', 1);

    $this->actingAs($this->owner)
        ->patch(kanbanSyncUrl($this->project, "cards/{$this->card->kanban_board_card_id}/dates"), [
            'kanban_board_card_due_date' => null,
        ])
        ->assertRedirect();

    $this->assertDatabaseCount('reminders', 0);
});

it('deleting the card cascades its kanban-sourced reminders', function () {
    /** @var mixed $this */
    $this->actingAs($this->owner)
        ->post(kanbanSyncUrl($this->project, "cards/{$this->card->kanban_board_card_id}/members"), [
            'user_id' => $this->member->id,
        ]);
    $this->actingAs($this->owner)
        ->patch(kanbanSyncUrl($this->project, "cards/{$this->card->kanban_board_card_id}/dates"), [
            'kanban_board_card_due_date' => '2026-09-01',
        ]);

    $reminder = Reminder::where('kanban_board_card_id', $this->card->kanban_board_card_id)->firstOrFail();

    $this->actingAs($this->owner)
        ->delete(kanbanSyncUrl($this->project, "kanban/boards/{$this->board->kanban_board_id}/cards/{$this->card->kanban_board_card_id}"))
        ->assertRedirect();

    $this->assertDatabaseMissing('reminders', ['reminder_id' => $reminder->reminder_id]);
});
