<?php

namespace App\Jobs;

use App\Events\TaskConflictCreated;
use App\Models\CalendarEvent;
use App\Models\KanbanBoardCard;
use App\Models\TaskConflict;
use Carbon\CarbonInterface;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Runs async after a Kanban card gets both an assignee and a due date
 * (dispatched from KanbanCardDetailController::addMember()/updateDates()),
 * so assignment itself never blocks on this check. Looks for an overlap
 * between the card's due date and the assignee's existing commitments on
 * that same calendar day — both real CalendarEvents they participate in and
 * other Kanban cards due-dated and assigned to them, regardless of time of
 * day — and, if found, creates a pending TaskConflict for the assignee to
 * accept or decline. A pending conflict already open for this card/assignee
 * pair short-circuits the check instead of piling up duplicates. A card
 * marked done (`is_completed`) is skipped entirely, and never considered as
 * the "other" commitment either — a finished task can't conflict with
 * anything.
 */
class CheckTaskConflictJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, SerializesModels;

    public function __construct(
        public readonly string $kanbanBoardCardId,
        public readonly int $assigneeUserId,
        public readonly int $assignedByUserId
    ) {}

    public function handle(): void
    {
        $card = KanbanBoardCard::find($this->kanbanBoardCardId);

        if (! $card || ! $card->kanban_board_card_due_date || $card->is_completed) {
            return;
        }

        $alreadyPending = TaskConflict::where('kanban_board_card_id', $card->kanban_board_card_id)
            ->where('assignee_user_id', $this->assigneeUserId)
            ->where('status', 'pending')
            ->exists();

        if ($alreadyPending) {
            return;
        }

        $windowStart = $card->kanban_board_card_due_date->copy()->startOfDay();
        $windowEnd = $card->kanban_board_card_due_date->copy()->endOfDay();

        $conflict = $this->findCalendarConflict($windowStart, $windowEnd)
            ?? $this->findKanbanConflict($card, $windowStart, $windowEnd);

        if ($conflict === null) {
            return;
        }

        $taskConflict = TaskConflict::create([
            'kanban_board_card_id' => $card->kanban_board_card_id,
            'assignee_user_id' => $this->assigneeUserId,
            'assigned_by_user_id' => $this->assignedByUserId,
            'conflicting_title' => $conflict['title'],
            'conflicting_start' => $conflict['start'],
            'conflicting_end' => $conflict['end'],
            'status' => 'pending',
        ]);

        TaskConflictCreated::dispatch($taskConflict);
    }

    /**
     * @return array{title: string, start: CarbonInterface, end: CarbonInterface}|null
     */
    private function findCalendarConflict($windowStart, $windowEnd): ?array
    {
        $event = CalendarEvent::whereHas(
            'participants',
            fn ($q) => $q->where('user_id', $this->assigneeUserId)
        )
            ->where('start_time', '<', $windowEnd)
            ->where('end_time', '>', $windowStart)
            ->first();

        if (! $event) {
            return null;
        }

        return [
            'title' => $event->title,
            'start' => $event->start_time,
            'end' => $event->end_time,
        ];
    }

    /**
     * @return array{title: string, start: CarbonInterface, end: CarbonInterface}|null
     */
    private function findKanbanConflict(KanbanBoardCard $excludingCard, $windowStart, $windowEnd): ?array
    {
        $card = KanbanBoardCard::where('kanban_board_card_id', '!=', $excludingCard->kanban_board_card_id)
            ->where('is_completed', false)
            ->whereHas('members', fn ($q) => $q->where('users.id', $this->assigneeUserId))
            ->whereNotNull('kanban_board_card_due_date')
            ->where('kanban_board_card_due_date', '<', $windowEnd)
            ->where('kanban_board_card_due_date', '>=', $windowStart)
            ->first();

        if (! $card) {
            return null;
        }

        return [
            'title' => $card->kanban_board_card_title,
            'start' => $card->kanban_board_card_due_date,
            'end' => $card->kanban_board_card_due_date->copy()->addHour(),
        ];
    }
}
