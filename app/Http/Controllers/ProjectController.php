<?php

namespace App\Http\Controllers;

use App\Models\CardAssignmentNotice;
use App\Models\ChatRoom;
use App\Models\Project;
use App\Models\Reminder;
use App\Models\TaskConflict;
use App\Services\AccountSessionService;
use App\Services\CalendarService;
use App\Services\ChatMessageService;
use App\Services\ChatRoomService;
use App\Services\StorageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProjectController extends Controller
{
    public function __construct(private readonly StorageService $storage) {}

    public function index(): Response
    {
        $user = auth()->user();

        $projectColumns = ['projects.project_id', 'projects.project_name', 'projects.project_slug', 'projects.avatar_color', 'projects.avatar_url'];

        $recentProjects = $user->projects()
            ->wherePivotNotNull('opened_at')
            ->orderByPivot('opened_at', 'desc')
            ->limit(4)
            ->get($projectColumns)
            ->map(fn ($p) => [
                'project_id' => $p->project_id,
                'project_name' => $p->project_name,
                'project_slug' => $p->project_slug,
                'avatar_color' => $p->avatar_color ?? 'accent-blue',
                'avatar_url' => $this->storage->url($p->avatar_url),
                'is_pinned' => (bool) $p->pivot->is_pinned,
                'role' => $p->pivot->role,
            ]);

        $paginated = $user->projects()
            ->orderByPivot('is_pinned', 'desc')
            ->orderBy('projects.project_name')
            ->paginate(5, $projectColumns);

        $projects = $paginated->through(fn ($p) => [
            'project_id' => $p->project_id,
            'project_name' => $p->project_name,
            'project_slug' => $p->project_slug,
            'avatar_color' => $p->avatar_color ?? 'accent-blue',
            'avatar_url' => $this->storage->url($p->avatar_url),
            'is_pinned' => (bool) $p->pivot->is_pinned,
            'role' => $p->pivot->role,
        ]);

        return Inertia::render('projects/index', [
            'recentProjects' => $recentProjects,
            'projects' => $projects,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'project_name' => ['required', 'string', 'max:50', 'regex:/^[a-zA-Z0-9\- ]+$/'],
            'project_slug' => ['required', 'string', 'max:65', 'regex:/^[a-z0-9-]+$/'],
        ]);

        $slug = Project::generateUniqueSlug($validated['project_slug']);

        $project = Project::create([
            'project_name' => trim($validated['project_name']),
            'project_slug' => $slug,
        ]);

        auth()->user()->projects()->attach($project->project_id, [
            'role' => 'OWNER',
            'opened_at' => now(),
            'color' => CalendarService::assignMemberColor($project->project_id),
        ]);

        // Auto-create group chat room for the project
        app(ChatRoomService::class)->createProjectGroupRoom($project, auth()->id());

        $accountIndex = max(
            0,
            (int) $request->route(
                'accountIndex',
                $request->attributes->get('account.index', AccountSessionService::getActiveIndex($request)),
            ),
        );

        return redirect()->route('projects.show', [
            'accountIndex' => $accountIndex,
            'project' => $project->project_slug,
        ]);
    }

    /**
     * Lightweight "does this project have anything unread for me" flag per
     * project, for the project switcher's notification dot — fetched
     * on-demand only when the switcher opens (mirrors NotificationPanel's
     * lazy-fetch pattern), never eagerly shared on every page load, since it
     * spans every project the user's in rather than just the current one.
     */
    public function notificationStatus(Request $request, ChatMessageService $messageService): JsonResponse
    {
        $validated = $request->validate([
            'project_ids' => ['sometimes', 'array'],
            'project_ids.*' => ['string'],
        ]);

        $user = auth()->user();

        // Intersect with actual membership — defense in depth, since a
        // client could otherwise pass arbitrary ids (though every query
        // below is already scoped by $user->id, so nothing would leak).
        $projectIds = $user->projects()
            ->whereIn('projects.project_id', $validated['project_ids'] ?? [])
            ->pluck('projects.project_id')
            ->all();

        if ($projectIds === []) {
            return response()->json([]);
        }

        $statuses = array_fill_keys($projectIds, false);

        Reminder::where('reminder_user_id', $user->id)
            ->where('is_completed', false)
            ->whereNull('notification_read_at')
            ->whereNotNull('reminder_due_at')
            ->where('reminder_due_at', '<=', now()->addDay())
            ->whereIn('reminder_project_id', $projectIds)
            ->distinct()
            ->pluck('reminder_project_id')
            ->each(function ($id) use (&$statuses) {
                $statuses[$id] = true;
            });

        CardAssignmentNotice::where('assignee_user_id', $user->id)
            ->whereNull('read_at')
            ->whereHas('kanbanBoardCard.kanbanBoard', fn ($q) => $q->whereIn('kanban_board_project_id', $projectIds))
            ->with('kanbanBoardCard.kanbanBoard:kanban_board_id,kanban_board_project_id')
            ->get()
            ->each(function (CardAssignmentNotice $notice) use (&$statuses) {
                $projectId = $notice->kanbanBoardCard?->kanbanBoard?->kanban_board_project_id;
                if ($projectId !== null) {
                    $statuses[$projectId] = true;
                }
            });

        // Pending conflicts awaiting the assignee's response, and decline
        // alerts the assigner hasn't dismissed yet — same union NotificationController::index() uses.
        TaskConflict::where(function ($q) use ($user) {
            $q->where(fn ($sub) => $sub->where('assignee_user_id', $user->id)->whereNull('assignee_acknowledged_at'))
                ->orWhere(fn ($sub) => $sub->where('assigned_by_user_id', $user->id)->where('status', 'declined')->whereNull('assigner_acknowledged_at'));
        })
            ->whereHas('kanbanBoardCard.kanbanBoard', fn ($q) => $q->whereIn('kanban_board_project_id', $projectIds))
            ->with('kanbanBoardCard.kanbanBoard:kanban_board_id,kanban_board_project_id')
            ->get()
            ->each(function (TaskConflict $conflict) use (&$statuses) {
                $projectId = $conflict->kanbanBoardCard?->kanbanBoard?->kanban_board_project_id;
                if ($projectId !== null) {
                    $statuses[$projectId] = true;
                }
            });

        $rooms = ChatRoom::query()
            ->whereIn('project_id', $projectIds)
            ->whereHas('participants', fn ($q) => $q->where('user_id', $user->id))
            ->with('participants')
            ->get();

        foreach ($rooms as $room) {
            if ($statuses[$room->project_id]) {
                continue;
            }

            $lastReadMessageId = $room->participants
                ->firstWhere('id', $user->id)
                ?->pivot
                ->last_read_message_id;

            if ($messageService->countUnread($room->id, $lastReadMessageId, $user->id) > 0) {
                $statuses[$room->project_id] = true;
            }
        }

        return response()->json($statuses);
    }

    public function checkSlug(Request $request): JsonResponse
    {
        $slug = $request->query('slug', '');

        if (empty($slug)) {
            return response()->json(['available' => false]);
        }

        $exists = Project::where('project_slug', $slug)->exists();

        return response()->json(['available' => ! $exists]);
    }

    public function show(int $accountIndex, Project $project): RedirectResponse
    {
        $user = auth()->user();

        $membership = $user->projects()
            ->where('projects.project_id', $project->project_id)
            ->first();

        abort_if($membership === null, 403);

        $user->projects()->updateExistingPivot($project->project_id, [
            'opened_at' => now(),
        ]);

        return redirect()->route('projects.dashboard', [
            'accountIndex' => $accountIndex,
            'project' => $project->project_slug,
        ]);
    }

    public function togglePin(int $accountIndex, Project $project): RedirectResponse
    {
        $user = auth()->user();

        $membership = $user->projects()
            ->where('projects.project_id', $project->project_id)
            ->first();

        abort_if($membership === null, 403);

        $newValue = ! $membership->pivot->is_pinned;

        $user->projects()->updateExistingPivot($project->project_id, [
            'is_pinned' => $newValue,
        ]);

        return back();
    }
}
