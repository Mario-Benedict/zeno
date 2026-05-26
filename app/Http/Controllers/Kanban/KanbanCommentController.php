<?php

namespace App\Http\Controllers\Kanban;

use App\Http\Controllers\Controller;
use App\Models\KanbanBoardCard;
use App\Models\KanbanBoardCardComment;
use Illuminate\Http\Request;

class KanbanCommentController extends Controller
{
    /**
     * Create a new comment.
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
            'kanban_board_card_comment_message' => 'required|string',
        ]);

        $detail = $card->detail;
        if (!$detail) {
            return response()->json(['message' => 'Card detail not found'], 404);
        }

        // Create comment
        $comment = KanbanBoardCardComment::create([
            'kanban_board_card_detail_id' => $detail->kanban_board_card_detail_id,
            'kanban_board_card_comment_from' => $request->user()->id,
            'kanban_board_card_comment_message' => $validated['kanban_board_card_comment_message'],
        ]);

        // Load with user information
        $comment->load(['user']);

        return response()->json(['comment' => $comment], 201);
    }

    /**
     * Delete a comment.
     */
    public function destroy(Request $request, KanbanBoardCardComment $comment)
    {
        // Check authorization
        $detail = $comment->cardDetail;
        $card = $detail->kanbanBoardCard;
        $project = $card->kanbanBoard->project;

        if (!$request->user()->can('view', $project)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Only allow comment author or project admin to delete
        if ($comment->kanban_board_card_comment_from !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Delete comment
        $comment->delete();

        return response()->json(['message' => 'Comment deleted successfully']);
    }
}
