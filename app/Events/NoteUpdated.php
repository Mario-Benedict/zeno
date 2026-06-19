<?php

namespace App\Events;

use App\Models\Note;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * NoteUpdated
 * ------------
 * Broadcast when a shared note's title/content is saved.
 */
class NoteUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly Note $note,
        public readonly string $editedByAccountId,
    ) {}

    public function broadcastOn(): Channel
    {
        // FIX: Menggunakan note_id agar sesuai dengan primary key database kelompokmu
        return new PresenceChannel('note.'.$this->note->note_id);
    }

    public function broadcastAs(): string
    {
        return 'note.updated';
    }

    public function broadcastWith(): array
    {
        return [
            // FIX: Gunakan note_id untuk konsistensi data payload
            'id' => (string) $this->note->note_id,
            'title' => $this->note->title,
            'content' => $this->note->content,
            'editedBy' => $this->editedByAccountId,
            'updatedAt' => $this->note->updated_at?->toIso8601String(),
        ];
    }
}