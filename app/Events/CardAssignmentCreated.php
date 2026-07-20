<?php

namespace App\Events;

use App\Models\CardAssignmentNotice;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Queued, not `ShouldBroadcastNow` — same reasoning as `TaskConflictCreated`:
 * this fires from inside `NotifyCardAssignedJob`, itself already a queued
 * job, so broadcasting stays off the request/queue-worker's critical path.
 */
class CardAssignmentCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly CardAssignmentNotice $notice
    ) {}

    /**
     * Private per-user channel for the assignee, already authorized in
     * routes/channels.php for TaskConflictCreated/MessageSent.
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('notifications.user.'.$this->notice->assignee_user_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'card-assignment.created';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->notice->id,
            'kanban_board_card_id' => $this->notice->kanban_board_card_id,
        ];
    }
}
