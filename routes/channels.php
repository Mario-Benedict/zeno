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

// ── CHANNEL NOTES (PRESENCE + SYNC KONTEN) ──
Broadcast::channel('note.{noteId}', function ($user, $noteId) {
    $note = Note::with('project')->where('note_id', $noteId)->first();

    if (! $note) {
        return false;
    }

    // Shared note: hanya anggota project yang sama yang boleh join.
    if ($note->is_shared) {
        $isProjectMember = $note->project->members()->where('users.id', $user->id)->exists();

        return $isProjectMember
            ? ['id' => (int) $user->id, 'name' => $user->name]
            : false;
    }

    // Personal note: hanya pemilik asli.
    return (int) $user->id === (int) $note->user_id
        ? ['id' => (int) $user->id, 'name' => $user->name]
        : false;
});
