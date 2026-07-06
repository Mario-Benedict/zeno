<?php

namespace App\Http\Controllers\Kanban;

use App\Http\Controllers\Controller;
use App\Models\KanbanBoardCard;
use App\Models\KanbanBoardCardComment;
use App\Models\Project;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class KanbanCommentController extends Controller
{
    /*
    | Every route lives under `/p/{project:project_slug}/...`, so `Project $project`
    | is declared on each method so Laravel's positional resolver lines up
    | correctly — even when the body derives the project from a related model.
    */

    /**
     * Post a new comment on a card. Accepts an optional client-generated
     * `kanban_board_card_comment_id` for optimistic UI.
     */
    public function store(int $accountIndex, Request $request, Project $project, KanbanBoardCard $card): RedirectResponse
    {
        abort_unless($request->user()->can('view', $card->kanbanBoard->project), 403);

        $validated = $request->validate([
            'kanban_board_card_comment_id' => ['nullable', 'string', 'uuid'],
            'kanban_board_card_comment_message' => 'required|string',
        ]);

        $comment = new KanbanBoardCardComment([
            'kanban_board_card_id' => $card->kanban_board_card_id,
            'kanban_board_card_comment_from' => $request->user()->id,
            'kanban_board_card_comment_message' => $validated['kanban_board_card_comment_message'],
        ]);

        if (! empty($validated['kanban_board_card_comment_id'])) {
            $comment->kanban_board_card_comment_id = $validated['kanban_board_card_comment_id'];
        }

        $comment->save();

        return back();
    }

    /**
     * Delete a comment. Only the author may delete their own comments.
     */
    public function destroy(int $accountIndex, Request $request, Project $project, KanbanBoardCardComment $comment): RedirectResponse
    {
        $owningProject = $comment->card->kanbanBoard->project;
        abort_unless($request->user()->can('view', $owningProject), 403);
        abort_unless($comment->kanban_board_card_comment_from === $request->user()->id, 403);

        $comment->delete();

        return back();
    }
}
