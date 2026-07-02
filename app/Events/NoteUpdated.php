<?php

namespace App\Events;

use App\Http\Controllers\Notes\NoteController;
use App\Models\Note;
use App\Models\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NoteUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly Note $note,
        public readonly string $editedByUserId,
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PresenceChannel('note.'.$this->note->note_id),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'note' => NoteController::formatDetail($this->note),
            'editedBy' => $this->editedBy(),
        ];
    }

    public function broadcastAs(): string
    {
        return 'NoteUpdated';
    }

    private function editedBy(): ?array
    {
        $user = User::find($this->editedByUserId);

        return $user ? ['id' => (int) $user->id, 'name' => $user->name] : null;
    }
}
