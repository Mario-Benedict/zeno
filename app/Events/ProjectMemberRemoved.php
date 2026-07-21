<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Broadcast immediately (not queued) so the removed member is redirected
 * out of the project in real time instead of discovering it via a 403 on
 * their next request — the whole point of this event is to beat that race.
 */
class ProjectMemberRemoved implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly int $removedUserId,
        public readonly string $projectId,
    ) {}

    /**
     * Private per-user channel for the removed member, already authorized
     * in routes/channels.php for MessageSent/TaskConflictCreated/etc.
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('notifications.user.'.$this->removedUserId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'project-member.removed';
    }

    public function broadcastWith(): array
    {
        return [
            'project_id' => $this->projectId,
        ];
    }
}
