<?php

namespace App\Observers;

use App\Models\KanbanBoardCard;
use App\Models\Reminder;

class KanbanBoardCardObserver
{
    public function saved(KanbanBoardCard $card): void
    {
        if (! $card->wasRecentlyCreated
            && ! $card->wasChanged('kanban_board_card_due_date')
            && ! $card->wasChanged('kanban_board_card_title')) {
            return;
        }

        self::syncReminders($card);
    }

    /**
     * Keep the card's kanban-sourced reminders (one per assigned member) in
     * sync with its current due date, title, and member list. Called from
     * the `saved()` hook above, and directly from the member add/remove
     * endpoints since assigning a member to a card that already has a due
     * date should also create their reminder.
     */
    public static function syncReminders(KanbanBoardCard $card): void
    {
        if ($card->kanban_board_card_due_date === null) {
            Reminder::where('kanban_board_card_id', $card->kanban_board_card_id)
                ->where('source', 'kanban')
                ->delete();

            return;
        }

        $memberIds = $card->members()->pluck('users.id');

        Reminder::where('kanban_board_card_id', $card->kanban_board_card_id)
            ->where('source', 'kanban')
            ->whereNotIn('reminder_user_id', $memberIds)
            ->delete();

        $projectId = $card->kanbanBoard->kanban_board_project_id;

        foreach ($memberIds as $memberId) {
            Reminder::updateOrCreate(
                [
                    'kanban_board_card_id' => $card->kanban_board_card_id,
                    'reminder_user_id' => $memberId,
                ],
                [
                    'reminder_project_id' => $projectId,
                    'reminder_title' => $card->kanban_board_card_title,
                    'reminder_due_at' => $card->kanban_board_card_due_date,
                    'source' => 'kanban',
                ]
            );
        }
    }
}
