<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Queued (not `ShouldBroadcastNow`) — broadcasting is a side effect that
 * doesn't need to block the save request. Dispatching it synchronously here
 * meant a slow or unreachable broadcast connection (e.g. Reverb not running
 * locally) made "New Schedule" hang until PHP's execution time limit hit and
 * the request came back as a 500. Queuing it lets the HTTP response return as
 * soon as the event is persisted; delivery to connected clients happens on
 * the queue worker instead (`php artisan queue:listen`, already one of the
 * 4 documented local dev processes).
 */
class CalendarEventChanged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
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
