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
    $this->memberA = User::factory()->create();
    $this->memberB = User::factory()->create();
    $this->outsider = User::factory()->create();

    $this->project = Project::create([
        'project_name' => 'Project Zeno',
        'project_slug' => 'zeno-group',
    ]);
    $this->project->members()->attach($this->owner->id, ['role' => 'OWNER']);
    $this->project->members()->attach($this->memberA->id, ['role' => 'MEMBER']);
    $this->project->members()->attach($this->memberB->id, ['role' => 'MEMBER']);
    app(ChatRoomService::class)->createProjectGroupRoom($this->project, (string) $this->owner->id);
});

function chatGroupsStoreUrl(Project $project): string
{
    return "/u/0/p/{$project->project_slug}/chat/rooms/group";
}

it('creates a group room with a chosen subset of project members', function () {
    /** @var mixed $this */
    $this->actingAs($this->owner)
        ->post(chatGroupsStoreUrl($this->project), [
            'name' => 'Release Squad',
            'participant_ids' => [$this->memberA->id],
        ])
        ->assertRedirect();

    $room = ChatRoom::where('project_id', $this->project->project_id)
        ->where('type', 'group')
        ->where('name', 'Release Squad')
        ->first();

    expect($room)->not->toBeNull();
    // Creator is always included, even though only memberA was selected —
    // memberB should NOT be in this new room despite being a project member.
    expect($room->participants()->pluck('users.id')->sort()->values()->all())
        ->toEqual(collect([$this->owner->id, $this->memberA->id])->sort()->values()->all());
});

it('includes the creator even when they are not in participant_ids', function () {
    /** @var mixed $this */
    $this->actingAs($this->owner)
        ->post(chatGroupsStoreUrl($this->project), [
            'name' => 'No Self Select',
            'participant_ids' => [$this->memberA->id, $this->memberB->id],
        ])
        ->assertRedirect();

    $room = ChatRoom::where('project_id', $this->project->project_id)
        ->where('name', 'No Self Select')
        ->first();

    expect($room->participants()->where('user_id', $this->owner->id)->exists())->toBeTrue();
});

it('rejects a participant id that is not a member of this project', function () {
    /** @var mixed $this */
    $this->actingAs($this->owner)
        ->post(chatGroupsStoreUrl($this->project), [
            'name' => 'Invalid Group',
            'participant_ids' => [$this->outsider->id],
        ])
        ->assertSessionHasErrors('participant_ids.0');

    expect(ChatRoom::where('name', 'Invalid Group')->exists())->toBeFalse();
});

it('requires a group name', function () {
    /** @var mixed $this */
    $this->actingAs($this->owner)
        ->post(chatGroupsStoreUrl($this->project), [
            'participant_ids' => [$this->memberA->id],
        ])
        ->assertSessionHasErrors('name');
});
