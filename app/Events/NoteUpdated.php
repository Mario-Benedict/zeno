<?php

namespace App\Events;

use App\Models\Note;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel; // Wajib import ini
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow; // Wajib import ini
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NoteUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly Note $note,
        public readonly string $editedByAccountId,
    ) {}

    public function broadcastOn(): array
    {
        // PASTIKAN INI ADALAH PresenceChannel, BUKAN Channel BIASA!
        return [
            new PresenceChannel('note.' . $this->note->note_id),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'id'      => (string) $this->note->note_id,
            'title'   => $this->note->title,
            'content' => $this->note->content ?? ['html' => '', 'text' => ''],
        ];
    }

    public function broadcastAs(): string
    {
        return 'NoteUpdated';
    }
}