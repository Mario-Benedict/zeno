<?php

use App\Enums\ProjectRole;
use App\Events\ChatMemberJoined;
use App\Models\Project;
use App\Models\User;
use App\Services\ChatRoomService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

it('broadcasts ChatMemberJoined when a new member accepts a project invitation link', function () {
    Event::fake([ChatMemberJoined::class]);

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
    app(ChatRoomService::class)->createProjectGroupRoom($project, (string) $owner->id);

    $newMember = User::factory()->create();

    $this->actingAs($newMember)
        ->withSession([
            'accounts' => [['user_id' => $newMember->id]],
            'account_active_index' => 0,
        ])
        ->get("/invite/{$project->invitation_link}")
        ->assertRedirect();

    Event::assertDispatched(
        ChatMemberJoined::class,
        fn (ChatMemberJoined $event) => $event->projectId === $project->project_id,
    );
});

it('does not re-broadcast ChatMemberJoined for an already-existing member', function () {
    Event::fake([ChatMemberJoined::class]);

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
});
