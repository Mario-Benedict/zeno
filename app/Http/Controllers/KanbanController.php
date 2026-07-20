<?php

namespace App\Http\Controllers;

use App\Models\CardLabel;
use App\Models\Project;
use App\Support\Kanban\KanbanAttachmentUrlResolver;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class KanbanController extends Controller
{
    public function __construct(private readonly KanbanAttachmentUrlResolver $attachmentUrls) {}

    public function show(int $accountIndex, Request $request, Project $project)
    {
        $query = $request->validate([
            'board' => ['sometimes', 'string', 'uuid'],
            'card' => ['sometimes', 'string', 'uuid'],
        ]);

        // Eager load kanban boards with all related data
        $project->load([
            'kanbanBoards' => function ($query) {
                $query->orderBy('kanban_board_position');
            },
            'kanbanBoards.cards' => function ($query) {
                $query->orderBy('position', 'asc')
                    ->with([
                        'labels',
                        'members',
                        'checklists.items',
                        'attachments',
                        'comments.user',
                    ]);
            },
        ]);
        $this->attachmentUrls->resolveForProject($project);

        // Get card labels for this project
        $cardLabels = CardLabel::where('card_label_project_id', $project->project_id)->get();

        // Get all users associated with this project
        $projectUsers = $project->members()->get();

        // Get current user
        $currentUser = Auth::user();
        $requestedBoardId = $query['board'] ?? null;
        $activeBoardId = is_string($requestedBoardId)
            && $project->kanbanBoards->contains(
                fn ($board) => $board->kanban_board_id === $requestedBoardId,
            )
                ? $requestedBoardId
                : null;
        $requestedCardId = $query['card'] ?? null;
        $activeCardId = is_string($requestedCardId)
            && $project->kanbanBoards->contains(
                fn ($board) => $board->cards->contains(
                    fn ($card) => $card->kanban_board_card_id === $requestedCardId,
                ),
            )
                ? $requestedCardId
                : null;

        return Inertia::render('kanban', [
            'project' => $project,
            'kanbanBoards' => $project->kanbanBoards,
            'cardLabels' => $cardLabels,
            'projectUsers' => $projectUsers,
            'currentUser' => $currentUser,
            'activeBoardId' => $activeBoardId,
            // Deep-links a card open on load (e.g. from a notification), the
            // same way Chat's `?room=` opens a specific room.
            'activeCardId' => $activeCardId,
        ]);
    }
}
