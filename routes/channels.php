<?php

use App\Models\ChatRoom;
use App\Models\Note;
use App\Models\Project;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

// ── CHANNEL CHAT TIM (SUDAH BERHASIL) ──
Broadcast::channel('chat.{roomId}', function (User $user, string $roomId) {
    return ChatRoom::where('id', $roomId)
        ->whereHas('participants', fn ($q) => $q->where('user_id', $user->id))
        ->exists();
});

// Project-wide chat channel — used for events not scoped to a single room,
// e.g. notifying everyone in the project when a new member joins so their
// room list (group participants + newly pre-created DM) can refresh.
Broadcast::channel('chat.project.{projectId}', function (User $user, string $projectId) {
    $project = Project::where('project_id', $projectId)->first();

    return $project?->isMember($user) ?? false;
});

Broadcast::channel('calendar.user.{userId}', function (User $user, int $userId) {
    return $user->id === $userId;
});

Broadcast::channel('calendar.project.{projectId}', function (User $user, string $projectId) {
    return $user->projects()->where('projects.project_id', $projectId)->exists();
});

Broadcast::channel('notifications.user.{userId}', function (User $user, int $userId) {
    return $user->id === $userId;
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
