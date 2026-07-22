<?php

namespace App\Events;

use App\Models\TaskConflict;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Broadcast immediately (not queued) so the assigner sees the decline the
 * moment the assignee responds, fired directly from the request cycle.
 */
class TaskConflictDeclined implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly TaskConflict $conflict
    ) {}

    /**
     * Private per-user channel for the assigner who needs to be notified.
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('notifications.user.'.$this->conflict->assigned_by_user_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'task-conflict.declined';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->conflict->id,
            'kanban_board_card_id' => $this->conflict->kanban_board_card_id,
        ];
    }
}
