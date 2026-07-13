<?php

use App\Enums\ProjectRole;
use App\Events\MessageSent;
use App\Models\ChatRoom;
use App\Models\Project;
use App\Models\User;
use App\Services\ChatMessageService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;

uses(RefreshDatabase::class);

/**
 * Regression test for a production "Invalid socket ID" 500: Echo sends
 * X-Socket-ID as an empty string (not omitting the header) whenever its
 * WebSocket hasn't connected yet, and pusher-php-server's socket ID
 * validator rejects an empty-but-present value just as hard as a malformed
 * one. Guarding on header *presence* alone (hasHeader()) doesn't catch this
 * — it has to check the header's *value*, since toOthers()/dontBroadcastToCurrentUser()
 * just copies whatever Broadcast::socket() (i.e. the raw header) returns onto
 * the event, with no validation of its own.
 *
 * BROADCAST_CONNECTION=null in phpunit.xml means broadcast() never reaches
 * the real Pusher/Reverb client under test, so this asserts on the dispatched
 * event's `socket` property (set by toOthers()) instead of the HTTP response —
 * that's the exact value that would otherwise be handed to pusher-php-server.
 */
function createRoomForUser(User $user): array
{
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

    return [$project, $room];
}

it('does not set a socket to exclude when X-Socket-ID is present but empty', function () {
    Event::fake([MessageSent::class]);

    $user = User::factory()->create();
    [$project, $room] = createRoomForUser($user);

    $this->actingAs($user)
        ->withSession([
            'accounts' => [['user_id' => $user->id]],
            'account_active_index' => 0,
        ])
        ->withHeaders(['X-Socket-ID' => ''])
        ->postJson("/u/0/p/{$project->project_slug}/chat/rooms/{$room->id}/messages", [
            'type' => 'text',
            'body' => 'Sent before the socket connected',
        ])
        ->assertOk();

    Event::assertDispatched(MessageSent::class, fn (MessageSent $event) => $event->socket === null);
});

it('does exclude the sending socket when X-Socket-ID has a real value', function () {
    Event::fake([MessageSent::class]);

    $user = User::factory()->create();
    [$project, $room] = createRoomForUser($user);

    $this->actingAs($user)
        ->withSession([
            'accounts' => [['user_id' => $user->id]],
            'account_active_index' => 0,
        ])
        ->withHeaders(['X-Socket-ID' => '123.456'])
        ->postJson("/u/0/p/{$project->project_slug}/chat/rooms/{$room->id}/messages", [
            'type' => 'text',
            'body' => 'Sent with an active socket',
        ])
        ->assertOk();

    Event::assertDispatched(MessageSent::class, fn (MessageSent $event) => $event->socket === '123.456');
});

it('broadcasts chat notifications only to unmuted recipients', function () {
    Event::fake([MessageSent::class]);

    $sender = User::factory()->create();
    $recipient = User::factory()->create();
    $mutedRecipient = User::factory()->create();
    [$project, $room] = createRoomForUser($sender);
    $room->participants()->attach($recipient->id, [
        'role' => 'member',
        'is_muted' => false,
        'joined_at' => now(),
    ]);
    $room->participants()->attach($mutedRecipient->id, [
        'role' => 'member',
        'is_muted' => true,
        'joined_at' => now(),
    ]);

    $this->actingAs($sender)
        ->withSession([
            'accounts' => [['user_id' => $sender->id]],
            'account_active_index' => 0,
        ])
        ->postJson("/u/0/p/{$project->project_slug}/chat/rooms/{$room->id}/messages", [
            'type' => 'text',
            'body' => 'Notify the right people',
        ])
        ->assertOk();

    Event::assertDispatched(MessageSent::class, function (MessageSent $event) use ($room, $sender, $recipient, $mutedRecipient): bool {
        $channels = collect($event->broadcastOn())->pluck('name');

        return $channels->contains('private-chat.'.$room->id)
            && $channels->contains('private-notifications.user.'.$recipient->id)
            && ! $channels->contains('private-notifications.user.'.$sender->id)
            && ! $channels->contains('private-notifications.user.'.$mutedRecipient->id);
    });
});

it('never moves a participant read cursor backwards', function () {
    $user = User::factory()->create();
    [, $room] = createRoomForUser($user);
    $newerMessageId = '66a000000000000000000002';
    $olderMessageId = '66a000000000000000000001';
    $messageService = app(ChatMessageService::class);

    $messageService->markAsRead($room, (string) $user->id, $newerMessageId);
    $messageService->markAsRead($room, (string) $user->id, $olderMessageId);

    expect($room->participants()->whereKey($user->id)->firstOrFail()->pivot->last_read_message_id)
        ->toBe($newerMessageId);
});
