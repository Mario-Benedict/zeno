<?php

use App\Models\ChatRoom;
use App\Models\Project;
use App\Models\User;
use App\Services\ChatRoomService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    /** @var mixed $this */
    $this->owner = User::factory()->create();

    $this->project = Project::create([
        'project_name' => 'Old Name',
        'project_slug' => 'old-name',
    ]);
    $this->project->members()->attach($this->owner->id, ['role' => 'OWNER']);
});

it('renames the auto-created group chat room when the project is renamed', function () {
    /** @var mixed $this */
    app(ChatRoomService::class)->createProjectGroupRoom($this->project, (string) $this->owner->id);

    $this->actingAs($this->owner)
        ->withSession(['accounts' => [['user_id' => $this->owner->id]], 'account_active_index' => 0])
        ->patch("/u/0/p/{$this->project->project_slug}", ['project_name' => 'New Name'])
        ->assertRedirect();

    $this->project->refresh();
    expect($this->project->project_name)->toBe('New Name');

    $room = ChatRoom::where('project_id', $this->project->project_id)->where('type', 'group')->first();
    expect($room->name)->toBe('New Name');
});

it('does not rename a custom sub-group room that already has its own name', function () {
    /** @var mixed $this */
    $roomService = app(ChatRoomService::class);
    $roomService->createProjectGroupRoom($this->project, (string) $this->owner->id);
    $customRoom = $roomService->createCustomGroupRoom($this->project, $this->owner, 'Design Squad', []);

    $this->actingAs($this->owner)
        ->withSession(['accounts' => [['user_id' => $this->owner->id]], 'account_active_index' => 0])
        ->patch("/u/0/p/{$this->project->project_slug}", ['project_name' => 'New Name'])
        ->assertRedirect();

    expect($customRoom->fresh()->name)->toBe('Design Squad');
});

it('does nothing when the project name is unchanged', function () {
    /** @var mixed $this */
    app(ChatRoomService::class)->createProjectGroupRoom($this->project, (string) $this->owner->id);

    $this->actingAs($this->owner)
        ->withSession(['accounts' => [['user_id' => $this->owner->id]], 'account_active_index' => 0])
        ->patch("/u/0/p/{$this->project->project_slug}", ['project_name' => 'Old Name'])
        ->assertRedirect();

    $room = ChatRoom::where('project_id', $this->project->project_id)->where('type', 'group')->first();
    expect($room->name)->toBe('Old Name');
});
