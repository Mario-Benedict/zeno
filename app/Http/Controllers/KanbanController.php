<?php

namespace App\Http\Controllers;

use App\Models\CardLabel;
use App\Models\CardLabelCategory;
use App\Models\CardLabelColor;
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
                        'detail' => function ($q) {
                            $q->with([
                                'labels.color',
                                'labels.category',
                                'members',
                                'checklists.items',
                                'dates',
                                'attachments',
                                'comments.user',
                            ]);
                        },
                    ]);
            },
        ]);

        // Get all label colors for the project
        $cardLabelColors = CardLabelColor::all();

        // Get all label categories
        $cardLabelCategories = CardLabelCategory::all();

        // Get card labels for this project with color and category
        $cardLabels = CardLabel::where('card_label_project_id', $project->project_id)
            ->with(['color', 'category'])
            ->get();

        // Get all users associated with this project
        $projectUsers = $project->members()->get();

        // Get current user
        $currentUser = Auth::user();

        return Inertia::render('kanban', [
            'project' => $project,
            'kanbanBoards' => $project->kanbanBoards,
            'cardLabelColors' => $cardLabelColors,
            'cardLabelCategories' => $cardLabelCategories,
            'cardLabels' => $cardLabels,
            'projectUsers' => $projectUsers,
            'currentUser' => $currentUser,
        ]);
    }
}
