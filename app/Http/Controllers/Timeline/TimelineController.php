<?php

namespace App\Http\Controllers\Timeline;

use App\Http\Controllers\Controller;
use App\Http\Controllers\KanbanController;
use App\Models\CardLabel;
use App\Models\Project;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class TimelineController extends Controller
{
    /**
     * Render the per-project Timeline view.
     *
     * The Timeline is a pure alternative visualisation of the project's
     * existing Kanban tasks along a time axis — it reads the same board /
     * card / date tree as {@see KanbanController::show}
     * and reuses the Kanban write endpoints (card create, dates update) on
     * the frontend. No Timeline-specific tables, migrations, or write
     * endpoints exist; this action is read-only.
     */
    public function show(int $accountIndex, Project $project): Response
    {
        // Eager load the full board → card → detail tree so both the
        // timeline bars and the reused Kanban card-detail modal have every
        // field they need without triggering N+1 queries.
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

        $cardLabels = CardLabel::where('card_label_project_id', $project->project_id)
            ->with(['color', 'category'])
            ->get();

        $projectUsers = $project->members()->get();

        return Inertia::render('timeline', [
            // Send only the lightweight project shape the page + reused Kanban
            // modals need — mirroring HandleInertiaRequests — never the full
            // model, which would leak the project's invitation token / role.
            'project' => [
                'project_id' => $project->project_id,
                'project_name' => $project->project_name,
                'project_slug' => $project->project_slug,
                'avatar_color' => $project->avatar_color ?? 'accent-blue',
                'avatar_url' => $project->avatar_url
                    ? Storage::disk('public')->url($project->avatar_url)
                    : null,
            ],
            'kanbanBoards' => $project->kanbanBoards,
            'cardLabels' => $cardLabels,
            'projectUsers' => $projectUsers,
            'currentUser' => Auth::user(),
        ]);
    }
}
