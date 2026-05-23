<?php

namespace App\Http\Controllers\Kanban;

use App\Http\Controllers\Controller;
use App\Models\KanbanBoard;
use App\Models\Project;
use Illuminate\Http\Request;

class KanbanBoardController extends Controller
{
    /**
     * Store a newly created board in storage.
     */
    public function store(Request $request, Project $project)
    {
        // Check authorization
        if (!$request->user()->can('view', $project)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'position' => ['required', 'integer', 'min:0'],
        ]);

        $board = KanbanBoard::create([
            'kanban_board_project_id' => $project->project_id,
            'kanban_board_name' => trim($validated['name']),
            'kanban_board_position' => $validated['position'],
        ]);

        return response()->json(['board' => $board], 201);
    }

    /**
     * Update the specified board in storage.
     */
    public function update(Request $request, KanbanBoard $board)
    {
        // Validate request
        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'position' => 'nullable|integer|min:0',
        ]);

        // Check authorization
        $project = $board->project;
        if (!$request->user()->can('view', $project)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Update board
        $updateData = [];
        if (isset($validated['name'])) {
            $updateData['kanban_board_name'] = $validated['name'];
        }
        if (isset($validated['position'])) {
            $updateData['kanban_board_position'] = $validated['position'];
        }

        if (!empty($updateData)) {
            $board->update($updateData);
        }

        return response()->json(['board' => $board]);
    }

    /**
     * Remove the specified board from storage.
     */
    public function destroy(Request $request, KanbanBoard $board)
    {
        // Check authorization
        $project = $board->project;
        if (!$request->user()->can('view', $project)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Delete board and its cards
        $board->cards()->delete();
        $board->delete();

        return response()->json(['message' => 'Board deleted successfully']);
    }
}
