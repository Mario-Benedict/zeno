<?php

namespace App\Http\Controllers\Kanban;

use App\Http\Controllers\Controller;
use App\Models\KanbanBoard;
use App\Models\Project;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class KanbanBoardController extends Controller
{
    /**
     * Store a newly created board in storage.
     *
     * Accepts an optional client-generated `kanban_board_id` (UUID) so the
     * frontend can optimistically add the board before the round-trip — the
     * server simply uses the same id when persisting.
     */
    public function store(int $accountIndex, Request $request, Project $project): RedirectResponse
    {
        abort_unless($request->user()->can('view', $project), 403);

        $validated = $request->validate([
            'kanban_board_id' => ['nullable', 'string', 'uuid'],
            'name' => ['required', 'string', 'max:255'],
            'position' => ['required', 'integer', 'min:0'],
        ]);

        $board = new KanbanBoard([
            'kanban_board_project_id' => $project->project_id,
            'kanban_board_name' => trim($validated['name']),
            'kanban_board_position' => $validated['position'],
        ]);

        if (! empty($validated['kanban_board_id'])) {
            $board->kanban_board_id = $validated['kanban_board_id'];
        }

        $board->save();

        return back();
    }

    /**
     * Update the specified board in storage (rename or reorder).
     *
     * `$project` is bound from the `{project:project_slug}` URI segment —
     * required by Laravel's route resolver so the positional parameter
     * doesn't collide with `$board`. The project itself isn't used here
     * (we derive it from `$board->project` for authorization).
     */
    public function update(int $accountIndex, Request $request, Project $project, KanbanBoard $board): RedirectResponse
    {
        $this->assertBoardBelongsToProject($project, $board);
        abort_unless($request->user()->can('view', $project), 403);

        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'position' => 'nullable|integer|min:0',
        ]);

        $updateData = [];
        if (isset($validated['name'])) {
            $updateData['kanban_board_name'] = $validated['name'];
        }
        if (isset($validated['position'])) {
            $updateData['kanban_board_position'] = $validated['position'];
        }

        if (! empty($updateData)) {
            $board->update($updateData);
        }

        return back();
    }

    /**
     * Remove the specified board (and its cards) from storage.
     */
    public function destroy(int $accountIndex, Request $request, Project $project, KanbanBoard $board): RedirectResponse
    {
        $this->assertBoardBelongsToProject($project, $board);
        abort_unless($request->user()->can('view', $project), 403);

        $board->cards()->delete();
        $board->delete();

        return back();
    }

    private function assertBoardBelongsToProject(Project $project, KanbanBoard $board): void
    {
        abort_unless(
            $board->kanban_board_project_id === $project->project_id,
            404,
        );
    }
}
