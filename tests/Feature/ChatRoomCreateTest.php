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
    $this->member = User::factory()->create();

    $this->project = Project::create([
        'project_name' => 'Project Zeno',
        'project_slug' => 'zeno',
    ]);
    $this->project->members()->attach($this->owner->id, ['role' => 'OWNER']);
    $this->project->members()->attach($this->member->id, ['role' => 'MEMBER']);
    app(ChatRoomService::class)->createProjectGroupRoom($this->project, (string) $this->owner->id);
});

function chatRoomsStoreUrl(Project $project): string
{
    return "/u/0/p/{$project->project_slug}/chat/rooms";
}

it('creates a DM room given a plain integer recipient id', function () {
    /** @var mixed $this */
    $this->actingAs($this->owner)
        ->post(chatRoomsStoreUrl($this->project), [
            'recipient_id' => $this->member->id,
        ])
        ->assertRedirect();

    $room = ChatRoom::where('project_id', $this->project->project_id)
        ->where('type', 'dm')
        ->first();

    expect($room)->not->toBeNull();
    expect($room->participants()->pluck('users.id')->sort()->values()->all())
        ->toEqual(collect([$this->owner->id, $this->member->id])->sort()->values()->all());
});

it('reuses the existing DM room instead of creating a duplicate', function () {
    /** @var mixed $this */
    $existing = app(ChatRoomService::class)->findOrCreateDmRoom($this->project, $this->owner, $this->member);

    $this->actingAs($this->owner)
        ->post(chatRoomsStoreUrl($this->project), [
            'recipient_id' => $this->member->id,
        ])
        ->assertRedirect();

    $dmRooms = ChatRoom::where('project_id', $this->project->project_id)->where('type', 'dm')->get();

    expect($dmRooms)->toHaveCount(1);
    expect($dmRooms->first()->id)->toBe($existing->id);
});

it('rejects a recipient id that does not belong to any user', function () {
    /** @var mixed $this */
    $this->actingAs($this->owner)
        ->post(chatRoomsStoreUrl($this->project), [
            'recipient_id' => 999999,
        ])
        ->assertSessionHasErrors('recipient_id');
});
