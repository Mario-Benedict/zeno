<?php

namespace App\Jobs;

use App\Events\CardAssignmentCreated;
use App\Models\CardAssignmentNotice;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Runs async after a member is attached to a Kanban card (dispatched from
 * KanbanCardDetailController::addMember()), so assignment itself never
 * blocks on this. Creates an inbox-visible notice for the assignee, unless
 * they assigned themselves.
 */
class NotifyCardAssignedJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, SerializesModels;

    public function __construct(
        public readonly string $kanbanBoardCardId,
        public readonly int $assigneeUserId,
        public readonly int $assignedByUserId
    ) {}

    public function handle(): void
    {
        if ($this->assigneeUserId === $this->assignedByUserId) {
            return;
        }

        $notice = CardAssignmentNotice::create([
            'kanban_board_card_id' => $this->kanbanBoardCardId,
            'assignee_user_id' => $this->assigneeUserId,
            'assigned_by_user_id' => $this->assignedByUserId,
        ]);

        CardAssignmentCreated::dispatch($notice);
    }
}
