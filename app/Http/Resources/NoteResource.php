<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NoteResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'title'       => $this->title,
            'description' => $this->description,
            'content'     => $this->content,
            'embedUrl'    => $this->embed_url,
            'timeAgo'     => 'Last Updated: ' . $this->updated_at->diffForHumans(),
            'embedTitle' => $this->embed_title,
        ];
    }
}