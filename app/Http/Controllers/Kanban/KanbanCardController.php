<?php

namespace App\Http\Controllers\Kanban;

use App\Http\Controllers\Controller;
use App\Models\KanbanBoard;
use App\Models\KanbanBoardCard;
use App\Models\KanbanBoardCardDetail;
use Illuminate\Http\Request;

class KanbanCardController extends Controller
{
    /**
     * Store a newly created card in storage.
     */
    public function store(Request $request, KanbanBoard $board)
    {
        // Validate request
        $validated = $request->validate([
            'title' => 'required|string|max:20',
            'label_ids' => 'array',
            'label_ids.*' => 'string',
        ]);

        // Check authorization
        $project = $board->project;
        if (!$request->user()->can('view', $project)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Create card with position set to last position
        $lastPosition = $board->cards()->max('position') ?? -1;
        $card = new KanbanBoardCard([
            'kanban_board_id' => $board->kanban_board_id,
            'position' => $lastPosition + 1,
        ]);
        $card->save();

        // Create card detail
        $detail = new KanbanBoardCardDetail([
            'kanban_board_card_id' => $card->kanban_board_card_id,
            'kanban_board_card_title' => $validated['title'],
            'kanban_board_card_description' => null,
            'is_completed' => false,
        ]);
        $detail->save();

        // Attach labels if provided
        if (!empty($validated['label_ids'])) {
            $detail->labels()->attach($validated['label_ids']);
        }

        // Load full card data
        $card->load([
            'detail' => function ($q) {
                $q->with(['labels.color', 'labels.category', 'members', 'checklists.items']);
            },
        ]);

        return response()->json(['card' => $card], 201);
    }

    /**
     * Move card to another board.
     */
    public function move(Request $request, KanbanBoardCard $card)
    {
        // Validate request
        $validated = $request->validate([
            'board_id' => 'required|string',
            'position' => 'required|integer|min:0'
        ]);

        $oldBoardId = $card->kanban_board_id;
        $newBoardId = $validated['board_id'];
        $newPosition = $validated['position'];

        // Get all cards in destination board (excluding the card being moved)
        $cardsInDestination = KanbanBoardCard::where('kanban_board_id', $newBoardId)
            ->where('kanban_board_card_id', '!=', $card->kanban_board_card_id)
            ->orderBy('position')
            ->get()
            ->toArray();

        // Insert the moved card at the correct position
        array_splice($cardsInDestination, min($newPosition, count($cardsInDestination)), 0, [$card->toArray()]);

        // Update the moved card's board
        $card->update(['kanban_board_id' => $newBoardId]);

        // Recalculate positions for all cards in destination board
        foreach ($cardsInDestination as $index => $cardData) {
            KanbanBoardCard::where('kanban_board_card_id', $cardData['kanban_board_card_id'])
                ->update(['position' => $index]);
        }

        // If moved to different board, recalculate source board positions
        if ($oldBoardId !== $newBoardId) {
            $cardsInSource = KanbanBoardCard::where('kanban_board_id', $oldBoardId)
                ->orderBy('position')
                ->pluck('kanban_board_card_id');
            
            foreach ($cardsInSource as $index => $cardId) {
                KanbanBoardCard::where('kanban_board_card_id', $cardId)
                    ->update(['position' => $index]);
            }
        }

        return response()->json(['message' => 'Card moved']);
    }

    public function destroy(Request $request, KanbanBoardCard $card)
    {
        $project = $card->kanbanBoard->project;
        if (!$request->user()->can('view', $project)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $boardId = $card->kanban_board_id;
        $card->delete();

        // Recalculate positions for remaining cards in the board
        $remainingCards = KanbanBoardCard::where('kanban_board_id', $boardId)
            ->orderBy('position')
            ->pluck('kanban_board_card_id');
        
        foreach ($remainingCards as $index => $cardId) {
            KanbanBoardCard::where('kanban_board_card_id', $cardId)
                ->update(['position' => $index]);
        }

        return response()->json(['message' => 'Card deleted']);
    }
}
