<?php

namespace App\Support\Kanban;

use App\Models\Project;
use App\Services\StorageService;

class KanbanAttachmentUrlResolver
{
    public function __construct(private readonly StorageService $storage) {}

    /** Resolve stored relative paths only after the complete board tree is eager-loaded. */
    public function resolveForProject(Project $project): void
    {
        $project->kanbanBoards->each(function ($board): void {
            $board->cards->each(function ($card): void {
                $card->attachments->each(function ($attachment): void {
                    $path = $attachment->getRawOriginal('kanban_board_card_attachment_url');

                    if (is_string($path) && preg_match('/^https?:\/\//i', $path) !== 1) {
                        $attachment->setAttribute(
                            'kanban_board_card_attachment_url',
                            $this->storage->url($path),
                        );
                    }
                });
            });
        });
    }
}
