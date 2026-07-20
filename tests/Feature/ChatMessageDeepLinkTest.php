<?php

use App\Models\ChatRoom;
use App\Models\Project;
use App\Models\User;
use App\Services\ChatMessageService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function makeChatDeepLinkRoom(Project $project, User $user, string $name): ChatRoom
{
    $room = ChatRoom::create([
        'project_id' => $project->project_id,
        'type' => 'group',
        'name' => $name,
    ]);
    $room->participants()->attach($user->id, [
        'role' => 'member',
        'joined_at' => now(),
    ]);

    return $room;
}

it('loads an authorized message window around a chat search target', function () {
    $user = User::factory()->create();
    $project = Project::create([
        'project_name' => 'Chat Search Project',
        'project_slug' => 'chat-search-project',
    ]);
    $project->members()->attach($user->id, ['role' => 'OWNER']);
    $room = makeChatDeepLinkRoom($project, $user, 'General');
    $messageId = '64b7f3a2c12e4f0011223344';

    $this->mock(ChatMessageService::class, function ($mock) use ($messageId, $room, $user) {
        $mock->shouldReceive('getLastMessagePreviewsForRooms')
            ->once()
            ->with([$room->id])
            ->andReturn([]);
        $mock->shouldReceive('getMessagesAround')
            ->once()
            ->with($room->id, $messageId)
            ->andReturn([
                'messages' => [[
                    '_id' => $messageId,
                    'roomId' => $room->id,
                    'senderId' => (string) $user->id,
                    'body' => 'Search target',
                ]],
                'nextCursor' => null,
                'hasMore' => false,
            ]);
        $mock->shouldReceive('countUnread')
            ->once()
            ->with($room->id, null, $user->id)
            ->andReturn(0);
    });

    $this->actingAs($user)
        ->get("/u/0/p/{$project->project_slug}/chat?room={$room->id}&message={$messageId}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('activeRoomId', $room->id)
            ->where('activeMessageId', $messageId)
        );
});

it('returns the target batch and marks through the target on an inertia partial reload', function () {
    $user = User::factory()->create();
    $project = Project::create([
        'project_name' => 'Chat Partial Project',
        'project_slug' => 'chat-partial-project',
    ]);
    $project->members()->attach($user->id, ['role' => 'OWNER']);
    $room = makeChatDeepLinkRoom($project, $user, 'General');
    $messageId = '64b7f3a2c12e4f0011223344';
    $batch = [
        'messages' => [[
            '_id' => $messageId,
            'roomId' => $room->id,
            'senderId' => (string) $user->id,
            'body' => 'Search target',
        ]],
        'nextCursor' => '64b7f3a2c12e4f0011223300',
        'hasMore' => true,
    ];
    $manifest = public_path('build/manifest.json');
    $assetVersion = file_exists($manifest)
        ? hash_file('xxh128', $manifest)
        : '';

    $this->mock(ChatMessageService::class, function ($mock) use ($batch, $messageId, $room, $user) {
        $mock->shouldReceive('getLastMessagePreviewsForRooms')
            ->once()
            ->with([$room->id])
            ->andReturn([]);
        $mock->shouldReceive('getMessagesAround')
            ->once()
            ->with($room->id, $messageId)
            ->andReturn($batch);
        $mock->shouldReceive('countUnread')
            ->once()
            ->with($room->id, null, $user->id)
            ->andReturn(0);
        $mock->shouldReceive('markAsRead')
            ->once()
            ->withArgs(fn (ChatRoom $resolvedRoom, int|string $userId, ?string $readThroughId) => $resolvedRoom->id === $room->id
                && (int) $userId === $user->id
                && $readThroughId === $messageId
            );
    });

    $this->actingAs($user)
        ->withHeaders([
            'X-Inertia' => 'true',
            'X-Inertia-Version' => $assetVersion,
            'X-Inertia-Partial-Component' => 'chat/index',
            'X-Inertia-Partial-Data' => 'messages,nextCursor,hasMore',
        ])
        ->get("/u/0/p/{$project->project_slug}/chat?room={$room->id}&message={$messageId}")
        ->assertOk()
        ->assertJsonPath('props.messages.0._id', $messageId)
        ->assertJsonPath('props.nextCursor', $batch['nextCursor'])
        ->assertJsonPath('props.hasMore', true);
});

it('rejects a crafted chat room deep link from another project', function () {
    $user = User::factory()->create();
    $project = Project::create([
        'project_name' => 'Current Project',
        'project_slug' => 'current-project',
    ]);
    $otherProject = Project::create([
        'project_name' => 'Other Project',
        'project_slug' => 'other-chat-project',
    ]);
    $project->members()->attach($user->id, ['role' => 'OWNER']);
    $otherProject->members()->attach($user->id, ['role' => 'OWNER']);
    $foreignRoom = makeChatDeepLinkRoom($otherProject, $user, 'Foreign Room');

    $this->mock(ChatMessageService::class);

    $this->actingAs($user)
        ->get("/u/0/p/{$project->project_slug}/chat?room={$foreignRoom->id}")
        ->assertNotFound();
});

it('rejects a message target that does not belong to the authorized room', function () {
    $user = User::factory()->create();
    $project = Project::create([
        'project_name' => 'Chat Target Project',
        'project_slug' => 'chat-target-project',
    ]);
    $project->members()->attach($user->id, ['role' => 'OWNER']);
    $room = makeChatDeepLinkRoom($project, $user, 'General');
    $messageId = '64b7f3a2c12e4f0011223344';

    $this->mock(ChatMessageService::class, function ($mock) use ($messageId, $room) {
        $mock->shouldReceive('getLastMessagePreviewsForRooms')
            ->once()
            ->with([$room->id])
            ->andReturn([]);
        $mock->shouldReceive('getMessagesAround')
            ->once()
            ->with($room->id, $messageId)
            ->andReturn(null);
    });

    $this->actingAs($user)
        ->get("/u/0/p/{$project->project_slug}/chat?room={$room->id}&message={$messageId}")
        ->assertNotFound();
});
