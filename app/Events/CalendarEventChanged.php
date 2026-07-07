<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CalendarEventChanged implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * @param  string  $projectId
     * @param  array  $participantIds
     * @param  string  $action  'created', 'updated', 'deleted'
     */
    public function __construct(
        public readonly string $projectId,
        public readonly array $participantIds,
        public readonly string $action
    ) {}

    /**
     * Broadcast on a per-project channel for full details,
     * AND per-user channels for cross-project busy-block updates.
     */
    public function broadcastOn(): array
    {
        $channels = [
            new PrivateChannel('calendar.project.'.$this->projectId),
        ];

        foreach ($this->participantIds as $userId) {
            $channels[] = new PrivateChannel('calendar.user.'.$userId);
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'calendar.changed';
    }
}
