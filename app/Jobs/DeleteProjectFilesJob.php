<?php

namespace App\Jobs;

use App\Services\ChatMessageService;
use App\Services\StorageService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Cleans up everything a deleted project's MySQL foreign-key cascades can't
 * reach: MongoDB chat messages (chat_rooms has no cross-database FK into
 * Mongo) and files sitting on disk/S3 that a deleted row only ever held a
 * path reference to (chat attachments, note images, the project avatar).
 * Dispatched from ProjectSettingsController::destroy() with plain
 * id/path arrays captured before the project row (and everything that
 * cascades from it) was deleted.
 */
class DeleteProjectFilesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, SerializesModels;

    /**
     * @param  string[]  $chatRoomIds
     * @param  string[]  $noteIds
     */
    public function __construct(
        public readonly array $chatRoomIds,
        public readonly array $noteIds,
        public readonly ?string $avatarPath,
    ) {}

    public function handle(ChatMessageService $chatMessages, StorageService $storage): void
    {
        foreach ($this->chatRoomIds as $roomId) {
            $chatMessages->deleteAllForRoom($roomId);
        }

        foreach ($this->noteIds as $noteId) {
            $storage->deleteDirectory("notes/{$noteId}/images");
        }

        if ($this->avatarPath) {
            $storage->delete($this->avatarPath);
        }
    }
}
