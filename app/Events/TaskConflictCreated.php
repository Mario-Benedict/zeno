<?php

namespace App\Events;

use App\Models\TaskConflict;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Queued, not `ShouldBroadcastNow` — same reasoning as `CalendarEventChanged`:
 * this fires from inside `CheckTaskConflictJob`, itself already a queued
 * job, so broadcasting stays off the request/queue-worker's critical path.
 */
class TaskConflictCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly TaskConflict $conflict
    ) {}

    /**
     * Private per-user channel for the assignee who needs to respond.
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('notifications.user.'.$this->conflict->assignee_user_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'task-conflict.created';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->conflict->id,
            'kanban_board_card_id' => $this->conflict->kanban_board_card_id,
            'conflicting_title' => $this->conflict->conflicting_title,
            'conflicting_start' => $this->conflict->conflicting_start->toIso8601String(),
            'conflicting_end' => $this->conflict->conflicting_end->toIso8601String(),
        ];
    }
}
