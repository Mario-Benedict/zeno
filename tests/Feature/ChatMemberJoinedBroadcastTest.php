<?php

use App\Enums\ProjectRole;
use App\Events\ChatMemberJoined;
use App\Jobs\Chat\CreateMemberDirectMessageRooms;
use App\Models\ChatRoom;
use App\Models\Project;
use App\Models\User;
use App\Services\ChatRoomService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

it('broadcasts ChatMemberJoined when a new member accepts a project invitation link', function () {
    Event::fake([ChatMemberJoined::class]);
    Queue::fake([CreateMemberDirectMessageRooms::class]);

    $owner = User::factory()->create();
    $project = Project::create([
        'project_name' => 'Test Project',
        'project_slug' => Project::generateUniqueSlug('Test Project'),
        'avatar_color' => 'accent-blue',
        'invitation_link' => Str::random(48),
        'invitation_role' => ProjectRole::Member->value,
    ]);
    $project->members()->attach($owner->id, ['role' => ProjectRole::Owner->value]);
    // Mirrors ProjectController::store() creating the group room upfront.
    $groupRoom = app(ChatRoomService::class)->createProjectGroupRoom($project, (string) $owner->id);

    // A larger project previously created one DM room per member inside this
    // request, which could make PHP-FPM terminate and Nginx return 502 after
    // the project membership had already been written.
    $existingMembers = User::factory()->count(12)->create();
    foreach ($existingMembers as $existingMember) {
        $project->members()->attach($existingMember->id, ['role' => ProjectRole::Member->value]);
        $groupRoom->participants()->attach($existingMember->id, [
            'role' => 'member',
            'joined_at' => now(),
        ]);
    }

    $newMember = User::factory()->create();

    $this->actingAs($newMember)
        ->withSession([
            'accounts' => [['user_id' => $newMember->id]],
            'account_active_index' => 0,
        ])
        ->get("/invite/{$project->invitation_link}")
        ->assertRedirect(route('projects.dashboard', [
            'accountIndex' => 0,
            'project' => $project->project_slug,
        ], false));

    expect($project->members()->whereKey($newMember->id)->exists())->toBeTrue();
    expect(ChatRoom::query()
        ->where('project_id', $project->project_id)
        ->group()
        ->firstOrFail()
        ->participants()
        ->whereKey($newMember->id)
        ->exists())->toBeTrue();
    expect(ChatRoom::query()->where('project_id', $project->project_id)->dm()->count())->toBe(0);

    Queue::assertPushed(
        CreateMemberDirectMessageRooms::class,
        fn (CreateMemberDirectMessageRooms $job) => $job->projectId === $project->project_id
            && $job->userId === $newMember->id,
    );

    Event::assertDispatched(
        ChatMemberJoined::class,
        fn (ChatMemberJoined $event) => $event->projectId === $project->project_id,
    );
});

it('does not re-broadcast ChatMemberJoined for an already-existing member', function () {
    Event::fake([ChatMemberJoined::class]);
    Queue::fake([CreateMemberDirectMessageRooms::class]);

    $owner = User::factory()->create();
    $project = Project::create([
        'project_name' => 'Test Project',
        'project_slug' => Project::generateUniqueSlug('Test Project'),
        'avatar_color' => 'accent-blue',
        'invitation_link' => Str::random(48),
        'invitation_role' => ProjectRole::Member->value,
    ]);
    $project->members()->attach($owner->id, ['role' => ProjectRole::Owner->value]);

    $this->actingAs($owner)
        ->withSession([
            'accounts' => [['user_id' => $owner->id]],
            'account_active_index' => 0,
        ])
        ->get("/invite/{$project->invitation_link}")
        ->assertRedirect();

    Event::assertNotDispatched(ChatMemberJoined::class);
    Queue::assertNotPushed(CreateMemberDirectMessageRooms::class);
});

it('creates direct-message rooms for a new member on the queue', function () {
    $owner = User::factory()->create();
    $newMember = User::factory()->create();
    $project = Project::create([
        'project_name' => 'Queued Chat Project',
        'project_slug' => Project::generateUniqueSlug('Queued Chat Project'),
        'avatar_color' => 'accent-blue',
    ]);
    $project->members()->attach($owner->id, ['role' => ProjectRole::Owner->value]);
    $project->members()->attach($newMember->id, ['role' => ProjectRole::Member->value]);

    $job = new CreateMemberDirectMessageRooms($project->project_id, $newMember->id);
    $job->handle(app(ChatRoomService::class));

    $dmRoom = ChatRoom::query()
        ->where('project_id', $project->project_id)
        ->dm()
        ->firstOrFail();

    expect($dmRoom->participants()->whereKey($owner->id)->exists())->toBeTrue();
    expect($dmRoom->participants()->whereKey($newMember->id)->exists())->toBeTrue();
});
