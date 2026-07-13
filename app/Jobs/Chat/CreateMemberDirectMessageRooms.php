<?php

namespace App\Jobs\Chat;

use App\Models\Project;
use App\Models\User;
use App\Services\ChatRoomService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

/**
 * Creates the optional one-to-one rooms for a newly joined project member.
 *
 * A project may have many members, so this fan-out must never run inside the
 * invitation HTTP request. The group membership is sufficient for immediate
 * project access; direct-message rooms can be prepared asynchronously.
 */
class CreateMemberDirectMessageRooms implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $timeout = 120;

    public function __construct(
        public readonly string $projectId,
        public readonly int $userId,
    ) {
        // Keep this work asynchronous even if an environment accidentally
        // leaves QUEUE_CONNECTION=sync.
        $this->onConnection('database');
    }

    public function handle(ChatRoomService $roomService): void
    {
        $project = Project::find($this->projectId);
        $user = User::find($this->userId);

        if (! $project instanceof Project || ! $user instanceof User || ! $project->isMember($user)) {
            return;
        }

        $roomService->createDirectMessageRoomsForMember($project, $user);
    }
}
