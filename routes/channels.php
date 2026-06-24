<?php

use App\Models\ChatRoom;
use App\Models\User;
use App\Models\Note;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Auth;

// ── CHANNEL CHAT TIM (SUDAH BERHASIL) ──
Broadcast::channel('chat.{roomId}', function (User $user, string $roomId) {
    return ChatRoom::where('id', $roomId)
        ->whereHas('participants', fn ($q) => $q->where('user_id', $user->id))
        ->exists();
});

// ── CHANNEL NOTES (PRESENCE + SYNC KONTEN) ──
Broadcast::channel('note.{noteId}', function ($user, $noteId) {
    $note = Note::where('note_id', $noteId)->first();

    if (!$note) {
        return false;
    }

    // Shared note: semua anggota proyek yang login boleh join.
    if ($note->is_shared) {
        return [
            'id'   => (int) $user->id, // INT, harus konsisten dgn CollaboratorUser.id di frontend
            'name' => $user->name,
        ];
    }

    // Personal note: hanya pemilik asli.
    return (int) $user->id === (int) $note->user_id
        ? ['id' => (int) $user->id, 'name' => $user->name]
        : false;
});