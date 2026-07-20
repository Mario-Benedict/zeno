<?php

namespace App\Http\Controllers\Kanban;

use App\Http\Controllers\Controller;
use App\Models\KanbanBoardCard;
use App\Models\KanbanBoardCardChecklist;
use App\Models\KanbanBoardCardChecklistItem;
use App\Models\Project;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class KanbanChecklistController extends Controller
{
    /*
    | Every route in this controller is nested under `/p/{project:project_slug}/...`,
    | so `Project $project` is declared on each method for Laravel's positional
    | route resolver — even where the body doesn't reference it directly.
    */

    /**
     * Create a new checklist on a card. Accepts an optional client-generated
     * `kanban_board_card_checklist_id` for optimistic rendering.
     */
    public function store(int $accountIndex, Request $request, Project $project, KanbanBoardCard $card): RedirectResponse
    {
        $this->assertCardBelongsToProject($project, $card);
        abort_unless($request->user()->can('view', $project), 403);

        $validated = $request->validate([
            'kanban_board_card_checklist_id' => ['nullable', 'string', 'uuid'],
            'kanban_board_card_checklist_name' => 'required|string|max:255',
        ]);

        $checklist = new KanbanBoardCardChecklist([
            'kanban_board_card_id' => $card->kanban_board_card_id,
            'kanban_board_card_checklist_name' => $validated['kanban_board_card_checklist_name'],
        ]);

        if (! empty($validated['kanban_board_card_checklist_id'])) {
            $checklist->kanban_board_card_checklist_id = $validated['kanban_board_card_checklist_id'];
        }

        $checklist->save();

        return back();
    }

    /**
     * Add an item to an existing checklist. Accepts an optional client-
     * generated `kanban_board_card_checklist_item_id` for optimistic UI.
     */
    public function addItem(int $accountIndex, Request $request, Project $project, KanbanBoardCardChecklist $checklist): RedirectResponse
    {
        $this->assertChecklistBelongsToProject($project, $checklist);
        abort_unless($request->user()->can('view', $project), 403);

        $validated = $request->validate([
            'kanban_board_card_checklist_item_id' => ['nullable', 'string', 'uuid'],
            'kanban_board_card_checklist_item_name' => 'required|string|max:255',
        ]);

        $item = new KanbanBoardCardChecklistItem([
            'kanban_board_card_checklist_id' => $checklist->kanban_board_card_checklist_id,
            'kanban_board_card_checklist_item_name' => $validated['kanban_board_card_checklist_item_name'],
            'is_completed' => false,
        ]);

        if (! empty($validated['kanban_board_card_checklist_item_id'])) {
            $item->kanban_board_card_checklist_item_id = $validated['kanban_board_card_checklist_item_id'];
        }

        $item->save();

        return back();
    }

    /**
     * Update an existing checklist item (name and / or completed flag).
     */
    public function updateItem(int $accountIndex, Request $request, Project $project, KanbanBoardCardChecklistItem $item): RedirectResponse
    {
        $this->assertItemBelongsToProject($project, $item);
        abort_unless($request->user()->can('view', $project), 403);

        $validated = $request->validate([
            'kanban_board_card_checklist_item_name' => 'string|max:255',
            'is_completed' => 'boolean',
        ]);

        $item->update($validated);

        return back();
    }

    /**
     * Delete a checklist item.
     */
    public function destroyItem(int $accountIndex, Request $request, Project $project, KanbanBoardCardChecklistItem $item): RedirectResponse
    {
        $this->assertItemBelongsToProject($project, $item);
        abort_unless($request->user()->can('view', $project), 403);

        $item->delete();

        return back();
    }

    /**
     * Delete a checklist and all of its items.
     */
    public function destroy(int $accountIndex, Request $request, Project $project, KanbanBoardCardChecklist $checklist): RedirectResponse
    {
        $this->assertChecklistBelongsToProject($project, $checklist);
        abort_unless($request->user()->can('view', $project), 403);

        $checklist->items()->delete();
        $checklist->delete();

        return back();
    }

    private function assertCardBelongsToProject(Project $project, KanbanBoardCard $card): void
    {
        abort_unless(
            $card->kanbanBoard->kanban_board_project_id === $project->project_id,
            404,
        );
    }

    private function assertChecklistBelongsToProject(Project $project, KanbanBoardCardChecklist $checklist): void
    {
        $this->assertCardBelongsToProject($project, $checklist->card);
    }

    private function assertItemBelongsToProject(Project $project, KanbanBoardCardChecklistItem $item): void
    {
        $this->assertChecklistBelongsToProject($project, $item->checklist);
    }
}
