<?php

namespace App\Http\Controllers\Calendar;

use App\Http\Controllers\Controller;
use App\Models\CardLabel;
use App\Models\Project;
use App\Services\CalendarService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class CalendarController extends Controller
{
    public function __construct(private readonly CalendarService $calendarService) {}

    public function show(Request $request): Response
    {
        $project = $this->resolveProject($request->route('project'));

        // Get all users associated with this project (including colors)
        $projectUsers = $project->members()->get()->map(fn ($u) => [
            'id' => $u->id,
            'name' => $u->name,
            'email' => $u->email,
            'color' => $u->pivot->color ?? '#7B7B7B',
        ])->values();

        $user = Auth::user();

        // Same project-scoped CardLabels Kanban uses (KanbanController::show)
        // — Calendar tags events with these instead of a fixed priority enum.
        $cardLabels = CardLabel::where('card_label_project_id', $project->project_id)->get();

        // The `{project:project_slug}` binding isn't substituted into a model
        // for these routes, so the globally-shared `project`/`projectRole`
        // props come through null. We therefore pass them explicitly, exactly
        // like the other project pages (kanban, chat) do.
        return Inertia::render('calendar', [
            'project' => [
                'project_id' => $project->project_id,
                'project_name' => $project->project_name,
                'project_slug' => $project->project_slug,
                'avatar_color' => $project->avatar_color ?? 'accent-blue',
                'avatar_url' => $project->avatar_url,
            ],
            'projectRole' => $project->roleFor($user)?->value,
            'projectUsers' => $projectUsers,
            'cardLabels' => $cardLabels,
            'currentUser' => [
                'id' => $user?->getAuthIdentifier(),
                'name' => $user?->name,
                'email' => $user?->email,
            ],
        ]);
    }

    public function events(Request $request): JsonResponse
    {
        $project = $this->resolveProject($request->route('project'));

        $request->validate([
            'start' => ['required', 'date'],
            'end' => ['required', 'date'],
            'users' => ['sometimes', 'array'],
            'users.*' => ['integer'],
        ]);

        $viewerId = Auth::id();
        $userIds = $request->input('users', []);

        $start = Carbon::parse($request->input('start'))->utc();
        $end = Carbon::parse($request->input('end'))->utc();

        $events = $this->calendarService->getEventsForView(
            $project->project_id,
            $viewerId,
            $userIds,
            $start,
            $end
        );

        return response()->json($events);
    }

    private function resolveProject(Project|string|null $project): Project
    {
        if ($project instanceof Project) {
            return $project;
        }

        if (! is_string($project) || $project === '') {
            abort(404);
        }

        return Project::where('project_slug', $project)->firstOrFail();
    }
}
