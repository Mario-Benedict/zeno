<?php

namespace App\Http\Controllers;

use App\Models\CardLabel;
use App\Models\Project;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class KanbanController extends Controller
{
    public function show(int $accountIndex, Project $project)
    {
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

        // Get card labels for this project
        $cardLabels = CardLabel::where('card_label_project_id', $project->project_id)->get();

        // Get all users associated with this project
        $projectUsers = $project->members()->get();

        // Get current user
        $currentUser = Auth::user();

        return Inertia::render('kanban', [
            'project' => $project,
            'kanbanBoards' => $project->kanbanBoards,
            'cardLabels' => $cardLabels,
            'projectUsers' => $projectUsers,
            'currentUser' => $currentUser,
        ]);
    }
}
