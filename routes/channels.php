<?php

use App\Models\ChatRoom;
use App\Models\Note;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

// ── CHANNEL CHAT TIM (SUDAH BERHASIL) ──
Broadcast::channel('chat.{roomId}', function (User $user, string $roomId) {
    return ChatRoom::where('id', $roomId)
        ->whereHas('participants', fn ($q) => $q->where('user_id', $user->id))
        ->exists();
});

// ── Notes presence channel (real-time content sync) ──
Broadcast::channel('note.{noteId}', function (User $user, string $noteId) {
    $note = Note::with('project')->where('note_id', $noteId)->first();

    if (! $note) {
        return false;
    }

    // Shared note: only members of the same project may join.
    if ($note->is_shared) {
        return $note->project->isMember($user)
            ? ['id' => (int) $user->id, 'name' => $user->name]
            : false;
    }

    // Personal note: owner only.
    return (int) $user->id === (int) $note->user_id
        ? ['id' => (int) $user->id, 'name' => $user->name]
        : false;
});
