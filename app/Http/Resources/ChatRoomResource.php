<?php

namespace App\Http\Resources;

use App\Services\StorageService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * ChatRoomResource
 * -----------------
 * Transforms a ChatRoom model into the JSON shape consumed by the React frontend.
 *
 * Key responsibilities:
 *  - Resolves `avatar_path` → full URL via StorageService (local or S3)
 *  - Appends `participants` using ChatParticipantResource when loaded
 *  - Appends `last_message` preview when available (passed as additional data
 *    from the controller after fetching from MongoDB)
 *
 * Usage:
 *   return ChatRoomResource::collection($rooms);
 *   return new ChatRoomResource($room);
 */
class ChatRoomResource extends JsonResource
{
    /**
     * Optional last-message preview fetched from MongoDB.
     * Set via  (new ChatRoomResource($room))->additional(['lastMessage' => $preview])
     * or injected directly on the resource before collection transform.
     *
     * @var array<string, mixed>|null
     */
    public ?array $lastMessagePreview = null;

    public function toArray(Request $request): array
    {
        /** @var \App\Models\ChatRoom $this */
        return [
            'id'          => $this->id,
            'projectId'   => $this->project_id,
            'type'        => $this->type,
            'name'        => $this->name,

            'avatarUrl'   => $this->avatarUrl(),

            'participants' => ChatParticipantResource::collection(
                $this->whenLoaded('participants')
            ),

            'lastMessage' => $this->when(
                $this->lastMessagePreview !== null,
                $this->lastMessagePreview,
            ),

            'createdAt'   => $this->created_at->toIso8601String(),
            'updatedAt'   => $this->updated_at->toIso8601String(),
        ];
    }
}