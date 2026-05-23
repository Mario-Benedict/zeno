<?php

namespace App\Http\Controllers\Kanban;

use App\Http\Controllers\Controller;
use App\Models\KanbanBoardCard;
use App\Models\KanbanBoardCardChecklist;
use App\Models\KanbanBoardCardChecklistItem;
use Illuminate\Http\Request;

class KanbanChecklistController extends Controller
{
    /**
     * Create a new checklist.
     */
    public function store(Request $request, KanbanBoardCard $card)
    {
        // Check authorization
        $project = $card->kanbanBoard->project;
        if (!$request->user()->can('view', $project)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Validate request
        $validated = $request->validate([
            'kanban_board_card_checklist_name' => 'required|string|max:255',
        ]);

        $detail = $card->detail;
        if (!$detail) {
            return response()->json(['message' => 'Card detail not found'], 404);
        }

        // Create checklist
        $checklist = KanbanBoardCardChecklist::create([
            'kanban_board_card_checklist_detail_id' => $detail->kanban_board_card_detail_id,
            'kanban_board_card_checklist_name' => $validated['kanban_board_card_checklist_name'],
        ]);

        return response()->json(['checklist' => $checklist], 201);
    }

    /**
     * Add item to checklist.
     */
    public function addItem(Request $request, KanbanBoardCardChecklist $checklist)
    {
        // Check authorization
        $detail = $checklist->cardDetail;
        $card = $detail->kanbanBoardCard;
        $project = $card->kanbanBoard->project;

        if (!$request->user()->can('view', $project)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Validate request
        $validated = $request->validate([
            'kanban_board_card_checklist_item_name' => 'required|string|max:255',
        ]);

        // Create item
        $item = KanbanBoardCardChecklistItem::create([
            'kanban_board_card_checklist_id' => $checklist->kanban_board_card_checklist_id,
            'kanban_board_card_checklist_item_name' => $validated['kanban_board_card_checklist_item_name'],
            'is_completed' => false,
        ]);

        return response()->json(['item' => $item], 201);
    }

    /**
     * Update checklist item.
     */
    public function updateItem(Request $request, KanbanBoardCardChecklistItem $item)
    {
        // Check authorization
        $checklist = $item->checklist;
        $detail = $checklist->cardDetail;
        $card = $detail->kanbanBoardCard;
        $project = $card->kanbanBoard->project;

        if (!$request->user()->can('view', $project)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Validate request
        $validated = $request->validate([
            'kanban_board_card_checklist_item_name' => 'string|max:255',
            'is_completed' => 'boolean',
        ]);

        // Update item
        $item->update($validated);

        return response()->json(['item' => $item]);
    }

    /**
     * Delete checklist item.
     */
    public function destroyItem(Request $request, KanbanBoardCardChecklistItem $item)
    {
        // Check authorization
        $checklist = $item->checklist;
        $detail = $checklist->cardDetail;
        $card = $detail->kanbanBoardCard;
        $project = $card->kanbanBoard->project;

        if (!$request->user()->can('view', $project)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Delete item
        $item->delete();

        return response()->json(['message' => 'Item deleted successfully']);
    }

    /**
     * Delete checklist.
     */
    public function destroy(Request $request, KanbanBoardCardChecklist $checklist)
    {
        // Check authorization
        $detail = $checklist->cardDetail;
        $card = $detail->kanbanBoardCard;
        $project = $card->kanbanBoard->project;

        if (!$request->user()->can('view', $project)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Delete checklist and its items
        $checklist->items()->delete();
        $checklist->delete();

        return response()->json(['message' => 'Checklist deleted successfully']);
    }
}
