<?php

use App\Enums\ProjectRole;
use App\Models\ChatRoom;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('returns the created message as json for api-style callers like the dashboard chat widget', function () {
    $user = User::factory()->create();
    $project = Project::create([
        'project_name' => 'Test Project',
        'project_slug' => Project::generateUniqueSlug('Test Project'),
        'avatar_color' => 'accent-blue',
    ]);
    $project->members()->attach($user->id, ['role' => ProjectRole::Owner->value]);

    $room = ChatRoom::create([
        'project_id' => $project->project_id,
        'type' => 'group',
        'name' => $project->project_name,
    ]);
    $room->participants()->attach($user->id, [
        'role' => 'admin',
        'is_muted' => false,
        'joined_at' => now(),
    ]);

    $this->actingAs($user)
        ->withSession([
            'accounts' => [['user_id' => $user->id]],
            'account_active_index' => 0,
        ])
        ->postJson("/u/0/p/{$project->project_slug}/chat/rooms/{$room->id}/messages", [
            'type' => 'text',
            'body' => 'Hello from the dashboard widget',
        ])
        ->assertOk()
        ->assertJsonPath('message.body', 'Hello from the dashboard widget')
        ->assertJsonPath('message.senderId', $user->id);
});

it('still redirects back for a normal (non-json) inertia-style request', function () {
    $user = User::factory()->create();
    $project = Project::create([
        'project_name' => 'Test Project',
        'project_slug' => Project::generateUniqueSlug('Test Project'),
        'avatar_color' => 'accent-blue',
    ]);
    $project->members()->attach($user->id, ['role' => ProjectRole::Owner->value]);

    $room = ChatRoom::create([
        'project_id' => $project->project_id,
        'type' => 'group',
        'name' => $project->project_name,
    ]);
    $room->participants()->attach($user->id, [
        'role' => 'admin',
        'is_muted' => false,
        'joined_at' => now(),
    ]);

    $this->actingAs($user)
        ->withSession([
            'accounts' => [['user_id' => $user->id]],
            'account_active_index' => 0,
        ])
        ->post("/u/0/p/{$project->project_slug}/chat/rooms/{$room->id}/messages", [
            'type' => 'text',
            'body' => 'Hello from the full chat page',
        ])
        ->assertRedirect();
});
