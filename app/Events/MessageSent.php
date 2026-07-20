<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * @param  list<int>  $notificationRecipientIds
     */
    public function __construct(
        public readonly array $message,
        private readonly array $notificationRecipientIds = [],
    ) {}

    public function broadcastOn(): array
    {
        $channels = [
            new PrivateChannel('chat.'.$this->message['roomId']),
        ];

        foreach ($this->notificationRecipientIds as $userId) {
            $channels[] = new PrivateChannel('notifications.user.'.$userId);
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'message.sent';
    }

    public function broadcastWith(): array
    {
        return ['message' => $this->message];
    }
}
