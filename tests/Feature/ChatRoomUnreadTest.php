<?php

use App\Enums\ProjectRole;
use App\Models\ChatRoom;
use App\Models\Project;
use App\Models\User;
use App\Services\ChatMessageService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

it('ships per-room unread counts and resolved user avatars to the chat list', function () {
    Storage::fake('public');
    config(['filesystems.uploads_disk' => 'public']);

    $user = User::factory()->create(['avatar_url' => 'user-avatars/member.jpg']);
    Storage::disk('public')->put($user->avatar_url, 'avatar');
    $project = Project::create([
        'project_name' => 'Unread Project',
        'project_slug' => Project::generateUniqueSlug('Unread Project'),
    ]);
    $project->members()->attach($user->id, ['role' => ProjectRole::Owner->value]);
    $room = ChatRoom::create([
        'project_id' => $project->project_id,
        'type' => 'group',
        'name' => 'General',
    ]);
    $room->participants()->attach($user->id, [
        'role' => 'admin',
        'is_muted' => false,
        'joined_at' => now(),
    ]);

    $this->mock(ChatMessageService::class, function ($mock) use ($room, $user) {
        $mock->shouldReceive('getLastMessagePreviewsForRooms')
            ->once()
            ->with([$room->id])
            ->andReturn([]);
        $mock->shouldReceive('countUnread')
            ->once()
            ->with($room->id, null, $user->id)
            ->andReturn(4);
    });

    $this->actingAs($user)
        ->withSession([
            'accounts' => [['user_id' => $user->id]],
            'account_active_index' => 0,
        ])
        ->get("/u/0/p/{$project->project_slug}/chat")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('rooms.0.unreadCount', 4)
            ->where('rooms.0.participants.0.avatarUrl', '/storage/user-avatars/member.jpg')
            ->where('currentUser.avatarUrl', '/storage/user-avatars/member.jpg')
        );
});
