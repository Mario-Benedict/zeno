<?php

use App\Events\ProjectMemberRemoved;
use App\Models\KanbanBoard;
use App\Models\KanbanBoardCard;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;

uses(RefreshDatabase::class);

beforeEach(function () {
    /** @var mixed $this */
    $this->owner = User::factory()->create(['name' => 'Owner']);
    $this->member = User::factory()->create(['name' => 'Member']);

    $this->project = Project::create(['project_name' => 'Zeno', 'project_slug' => 'zeno-member-removal']);
    $this->project->members()->attach($this->owner->id, ['role' => 'OWNER', 'color' => '#D7CCC8']);
    $this->project->members()->attach($this->member->id, ['role' => 'MEMBER', 'color' => '#F8BBD0']);

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
    $this->card->members()->attach($this->member->id);
});

it('reports the assigned task count and titles for a member', function () {
    /** @var mixed $this */
    $this->actingAs($this->owner)
        ->withSession(['accounts' => [['user_id' => $this->owner->id]], 'account_active_index' => 0])
        ->getJson("/u/0/p/{$this->project->project_slug}/members/{$this->member->id}/assigned-tasks")
        ->assertOk()
        ->assertJson([
            'count' => 1,
            'cards' => [
                ['id' => $this->card->kanban_board_card_id, 'title' => 'Ship the release'],
            ],
        ]);
});

it('unassigns the member from every project card and dispatches a realtime removal event on destroy', function () {
    /** @var mixed $this */
    Event::fake([ProjectMemberRemoved::class]);

    $this->actingAs($this->owner)
        ->withSession(['accounts' => [['user_id' => $this->owner->id]], 'account_active_index' => 0])
        ->delete("/u/0/p/{$this->project->project_slug}/members/{$this->member->id}")
        ->assertRedirect();

    expect($this->project->fresh()->members()->where('users.id', $this->member->id)->exists())->toBeFalse();
    expect($this->card->fresh()->members()->where('users.id', $this->member->id)->exists())->toBeFalse();

    Event::assertDispatched(ProjectMemberRemoved::class, function (ProjectMemberRemoved $event) {
        return $event->removedUserId === $this->member->id
            && $event->projectId === $this->project->project_id;
    });
});
