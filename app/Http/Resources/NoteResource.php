<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NoteResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'       => $this->note_id,
            'title'    => $this->title,
            'content'  => $this->content,
            'isShared' => $this->is_shared,
            'timeAgo'  => 'Last Updated: ' . $this->updated_at->diffForHumans(),
            'userId'   => $this->user_id,
        ];
    }
}