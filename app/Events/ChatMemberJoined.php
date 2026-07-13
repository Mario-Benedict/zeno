<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Broadcasting\ShouldRescue;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\Attributes\Connection;
use Illuminate\Queue\SerializesModels;

/**
 * Broadcast when a user joins a project's group chat, so other connected
 * members' room lists (group participants + asynchronously prepared DM rooms)
 * refresh without a manual page reload.
 *
 * Queued (not `ShouldBroadcastNow`) for the same reason as
 * CalendarEventChanged — broadcasting is a side effect that shouldn't block
 * the invitation-accept request.
 */
#[Connection('database')]
class ChatMemberJoined implements ShouldBroadcast, ShouldRescue
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public readonly string $projectId) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('chat.project.'.$this->projectId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'member.joined';
    }
}
