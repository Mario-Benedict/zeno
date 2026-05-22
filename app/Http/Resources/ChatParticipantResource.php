<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * ChatParticipantResource
 * ------------------------
 * Serializes a User model in the context of a chat room participant.
 * Exposes only the fields the frontend needs — never leaks sensitive data.
 *
 * The `pivot` data (role, is_muted) is included when the model was loaded
 * via the BelongsToMany `participants()` relationship.
 */
class ChatParticipantResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        /** @var \App\Models\User $this */
        return [
            'id'        => $this->id,
            'name'      => $this->name,
            'email'     => $this->email,

            'avatarUrl' => $this->avatar_path
                ? app(\App\Services\StorageService::class)->url($this->avatar_path)
                : null,

            'role'      => $this->whenPivotLoaded('chat_room_participants', fn () => $this->pivot->role),
            'isMuted'   => $this->whenPivotLoaded('chat_room_participants', fn () => (bool) $this->pivot->is_muted),
        ];
    }
}