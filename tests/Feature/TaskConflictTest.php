<?php

use App\Events\TaskConflictDeclined;
use App\Models\CalendarEvent;
use App\Models\KanbanBoard;
use App\Models\KanbanBoardCard;
use App\Models\Project;
use App\Models\TaskConflict;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;

uses(RefreshDatabase::class);

beforeEach(function () {
    /** @var mixed $this */
    $this->admin = User::factory()->create(['name' => 'Admin']);
    $this->assignee = User::factory()->create(['name' => 'Assignee']);

    $this->project = Project::create(['project_name' => 'Zeno', 'project_slug' => 'zeno-conflict']);
    $this->project->members()->attach($this->admin->id, ['role' => 'OWNER', 'color' => '#D7CCC8']);
    $this->project->members()->attach($this->assignee->id, ['role' => 'MEMBER', 'color' => '#F8BBD0']);

    $this->board = KanbanBoard::create([
        'kanban_board_project_id' => $this->project->project_id,
        'kanban_board_name' => 'To Do',
        'kanban_board_position' => 0,
    ]);

    $this->dueDate = CarbonImmutable::now('UTC')->addDays(2)->setTime(10, 30);

    $this->card = KanbanBoardCard::create([
        'kanban_board_id' => $this->board->kanban_board_id,
        'position' => 0,
        'kanban_board_card_title' => 'Prepare the release',
        'is_completed' => false,
        'kanban_board_card_due_date' => $this->dueDate,
    ]);

    // Assignee already has a commitment that overlaps the card's due-date window.
    $this->existingEvent = new CalendarEvent;
    $this->existingEvent->project_id = $this->project->project_id;
    $this->existingEvent->title = 'Client sync';
    $this->existingEvent->start_time = $this->dueDate->copy()->subMinutes(15);
    $this->existingEvent->end_time = $this->dueDate->copy()->addMinutes(45);
    $this->existingEvent->created_by = $this->assignee->id;
    $this->existingEvent->recurrence = 'none';
    $this->existingEvent->save();
    $this->existingEvent->participants()->attach($this->assignee->id);
});

it('creates a pending task conflict when assigning a member whose schedule overlaps the due date', function () {
    /** @var mixed $this */
    $this->actingAs($this->admin)
        ->withSession(['accounts' => [['user_id' => $this->admin->id]], 'account_active_index' => 0])
        ->post("/u/0/p/{$this->project->project_slug}/cards/{$this->card->kanban_board_card_id}/members", [
            'user_id' => $this->assignee->id,
        ])
        ->assertRedirect();

    $conflict = TaskConflict::where('kanban_board_card_id', $this->card->kanban_board_card_id)->first();

    expect($conflict)->not->toBeNull();
    expect($conflict->assignee_user_id)->toBe($this->assignee->id);
    expect($conflict->assigned_by_user_id)->toBe($this->admin->id);
    expect($conflict->status)->toBe('pending');
    expect($conflict->conflicting_title)->toBe('Client sync');
});

it('does not create a conflict when there is no schedule overlap', function () {
    /** @var mixed $this */
    $this->existingEvent->update([
        'start_time' => $this->dueDate->copy()->addDays(5),
        'end_time' => $this->dueDate->copy()->addDays(5)->addHour(),
    ]);

    $this->actingAs($this->admin)
        ->withSession(['accounts' => [['user_id' => $this->admin->id]], 'account_active_index' => 0])
        ->post("/u/0/p/{$this->project->project_slug}/cards/{$this->card->kanban_board_card_id}/members", [
            'user_id' => $this->assignee->id,
        ])
        ->assertRedirect();

    expect(TaskConflict::where('kanban_board_card_id', $this->card->kanban_board_card_id)->exists())->toBeFalse();
});

it('creates a conflict for a same-day task in another project even when the times of day differ', function () {
    /** @var mixed $this */
    // Move the calendar-event overlap out of the way so only the
    // cross-project Kanban-vs-Kanban overlap is under test here.
    $this->existingEvent->update([
        'start_time' => $this->dueDate->copy()->addDays(5),
        'end_time' => $this->dueDate->copy()->addDays(5)->addHour(),
    ]);

    $otherProject = Project::create(['project_name' => 'Atlas', 'project_slug' => 'atlas-conflict']);
    $otherProject->members()->attach($this->admin->id, ['role' => 'OWNER', 'color' => '#D7CCC8']);
    $otherProject->members()->attach($this->assignee->id, ['role' => 'MEMBER', 'color' => '#F8BBD0']);

    $otherBoard = KanbanBoard::create([
        'kanban_board_project_id' => $otherProject->project_id,
        'kanban_board_name' => 'Backlog',
        'kanban_board_position' => 0,
    ]);

    // Same calendar day as $this->dueDate (10:30), but a very different
    // time of day (21:00) — the old due_date..+1h window would have missed
    // this entirely.
    $otherCard = KanbanBoardCard::create([
        'kanban_board_id' => $otherBoard->kanban_board_id,
        'position' => 0,
        'kanban_board_card_title' => 'Atlas deliverable',
        'is_completed' => false,
        'kanban_board_card_due_date' => $this->dueDate->copy()->setTime(21, 0),
    ]);
    $otherCard->members()->attach($this->assignee->id);

    $this->actingAs($this->admin)
        ->withSession(['accounts' => [['user_id' => $this->admin->id]], 'account_active_index' => 0])
        ->post("/u/0/p/{$this->project->project_slug}/cards/{$this->card->kanban_board_card_id}/members", [
            'user_id' => $this->assignee->id,
        ])
        ->assertRedirect();

    $conflict = TaskConflict::where('kanban_board_card_id', $this->card->kanban_board_card_id)->first();

    expect($conflict)->not->toBeNull();
    expect($conflict->conflicting_title)->toBe('Atlas deliverable');
});

it('does not create a duplicate pending conflict when the due date is edited again before the first is resolved', function () {
    /** @var mixed $this */
    $this->actingAs($this->admin)
        ->withSession(['accounts' => [['user_id' => $this->admin->id]], 'account_active_index' => 0])
        ->post("/u/0/p/{$this->project->project_slug}/cards/{$this->card->kanban_board_card_id}/members", [
            'user_id' => $this->assignee->id,
        ])
        ->assertRedirect();

    expect(TaskConflict::where('kanban_board_card_id', $this->card->kanban_board_card_id)->count())->toBe(1);

    // Still the same day, so it still overlaps the same existing event —
    // this re-triggers CheckTaskConflictJob, but the first conflict is
    // still pending and should not be duplicated.
    $this->actingAs($this->admin)
        ->withSession(['accounts' => [['user_id' => $this->admin->id]], 'account_active_index' => 0])
        ->patch("/u/0/p/{$this->project->project_slug}/cards/{$this->card->kanban_board_card_id}/dates", [
            'kanban_board_card_due_date' => $this->dueDate->copy()->addHour()->toIso8601String(),
        ])
        ->assertRedirect();

    expect(TaskConflict::where('kanban_board_card_id', $this->card->kanban_board_card_id)->count())->toBe(1);
});

it('lets the assignee accept a conflict', function () {
    /** @var mixed $this */
    $conflict = TaskConflict::create([
        'kanban_board_card_id' => $this->card->kanban_board_card_id,
        'assignee_user_id' => $this->assignee->id,
        'assigned_by_user_id' => $this->admin->id,
        'conflicting_title' => 'Client sync',
        'conflicting_start' => $this->existingEvent->start_time,
        'conflicting_end' => $this->existingEvent->end_time,
        'status' => 'pending',
    ]);

    $this->actingAs($this->assignee)
        ->patch("/u/0/task-conflicts/{$conflict->id}/respond", ['can_do_both' => true])
        ->assertRedirect();

    $conflict->refresh();

    expect($conflict->status)->toBe('accepted');
    expect($conflict->assignee_acknowledged_at)->not->toBeNull();
});

it('lets the assignee decline a conflict, which the assigner sees as a decline alert', function () {
    /** @var mixed $this */
    $conflict = TaskConflict::create([
        'kanban_board_card_id' => $this->card->kanban_board_card_id,
        'assignee_user_id' => $this->assignee->id,
        'assigned_by_user_id' => $this->admin->id,
        'conflicting_title' => 'Client sync',
        'conflicting_start' => $this->existingEvent->start_time,
        'conflicting_end' => $this->existingEvent->end_time,
        'status' => 'pending',
    ]);

    $this->actingAs($this->assignee)
        ->patch("/u/0/task-conflicts/{$conflict->id}/respond", ['can_do_both' => false])
        ->assertRedirect();

    $conflict->refresh();
    expect($conflict->status)->toBe('declined');

    $response = $this->actingAs($this->admin)
        ->withSession(['accounts' => [['user_id' => $this->admin->id]], 'account_active_index' => 0])
        ->getJson("/u/0/p/{$this->project->project_slug}/notifications")
        ->assertOk();

    $conflicts = collect($response->json('conflicts'));
    $alert = $conflicts->firstWhere('id', $conflict->id);

    expect($alert)->not->toBeNull();
    expect($alert['role'])->toBe('assigner');
    expect($alert['assignee_name'])->toBe('Assignee');
});

it('unassigns the card and notifies the assigner when the assignee declines', function () {
    /** @var mixed $this */
    Event::fake([TaskConflictDeclined::class]);

    $this->card->members()->attach($this->assignee->id);

    $conflict = TaskConflict::create([
        'kanban_board_card_id' => $this->card->kanban_board_card_id,
        'assignee_user_id' => $this->assignee->id,
        'assigned_by_user_id' => $this->admin->id,
        'conflicting_title' => 'Client sync',
        'conflicting_start' => $this->existingEvent->start_time,
        'conflicting_end' => $this->existingEvent->end_time,
        'status' => 'pending',
    ]);

    $this->actingAs($this->assignee)
        ->patch("/u/0/task-conflicts/{$conflict->id}/respond", ['can_do_both' => false])
        ->assertRedirect();

    expect($this->card->fresh()->members()->where('users.id', $this->assignee->id)->exists())->toBeFalse();

    Event::assertDispatched(TaskConflictDeclined::class, function (TaskConflictDeclined $event) use ($conflict) {
        return $event->conflict->id === $conflict->id;
    });
});

it('keeps the assignment when the assignee accepts a conflict', function () {
    /** @var mixed $this */
    $this->card->members()->attach($this->assignee->id);

    $conflict = TaskConflict::create([
        'kanban_board_card_id' => $this->card->kanban_board_card_id,
        'assignee_user_id' => $this->assignee->id,
        'assigned_by_user_id' => $this->admin->id,
        'conflicting_title' => 'Client sync',
        'conflicting_start' => $this->existingEvent->start_time,
        'conflicting_end' => $this->existingEvent->end_time,
        'status' => 'pending',
    ]);

    $this->actingAs($this->assignee)
        ->patch("/u/0/task-conflicts/{$conflict->id}/respond", ['can_do_both' => true])
        ->assertRedirect();

    expect($this->card->fresh()->members()->where('users.id', $this->assignee->id)->exists())->toBeTrue();
});

it('rejects a respond attempt from someone other than the assignee', function () {
    /** @var mixed $this */
    $conflict = TaskConflict::create([
        'kanban_board_card_id' => $this->card->kanban_board_card_id,
        'assignee_user_id' => $this->assignee->id,
        'assigned_by_user_id' => $this->admin->id,
        'conflicting_title' => 'Client sync',
        'conflicting_start' => $this->existingEvent->start_time,
        'conflicting_end' => $this->existingEvent->end_time,
        'status' => 'pending',
    ]);

    $this->actingAs($this->admin)
        ->patch("/u/0/task-conflicts/{$conflict->id}/respond", ['can_do_both' => true])
        ->assertForbidden();
});
