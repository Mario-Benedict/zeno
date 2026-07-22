<?php

namespace App\Http\Controllers;

use App\Events\CalendarEventChanged;
use App\Events\TaskConflictDeclined;
use App\Models\TaskConflict;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class TaskConflictController extends Controller
{
    /**
     * The assignee accepts or declines taking on both commitments. Declining
     * actually unassigns them from the card — otherwise the conflict is
     * "resolved" but the person is still stuck on the task they said no to.
     */
    public function respond(int $accountIndex, Request $request, TaskConflict $taskConflict): RedirectResponse
    {
        abort_unless($taskConflict->assignee_user_id === $request->user()->id, 403);

        $validated = $request->validate([
            'can_do_both' => ['required', 'boolean'],
        ]);

        $taskConflict->update([
            'status' => $validated['can_do_both'] ? 'accepted' : 'declined',
            'assignee_acknowledged_at' => now(),
        ]);

        if (! $validated['can_do_both']) {
            $card = $taskConflict->kanbanBoardCard;

            if ($card) {
                $affectedMemberIds = $card->members()->pluck('users.id')->all();

                $card->members()->detach($taskConflict->assignee_user_id);

                if ($card->kanban_board_card_due_date) {
                    $board = $card->kanbanBoard;
                    broadcast(new CalendarEventChanged(
                        $board->kanban_board_project_id,
                        $affectedMemberIds,
                        'updated'
                    ));
                }
            }

            TaskConflictDeclined::dispatch($taskConflict);
        }

        return back();
    }

    /**
     * The assigner dismisses a decline alert once they've seen it.
     */
    public function acknowledge(int $accountIndex, Request $request, TaskConflict $taskConflict): RedirectResponse
    {
        abort_unless($taskConflict->assigned_by_user_id === $request->user()->id, 403);

        $taskConflict->update(['assigner_acknowledged_at' => now()]);

        return back();
    }
}
