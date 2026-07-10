<?php

namespace App\Http\Controllers;

use App\Models\TaskConflict;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class TaskConflictController extends Controller
{
    /**
     * The assignee accepts or declines taking on both commitments.
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
