<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Services\AccountSessionService;
use App\Services\ChatRoomService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProjectController extends Controller
{
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
                'avatar_url' => $p->avatar_url,
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
            'avatar_url' => $p->avatar_url,
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

    public function checkSlug(Request $request): JsonResponse
    {
        $slug = $request->query('slug', '');

        if (empty($slug)) {
            return response()->json(['available' => false]);
        }

        $exists = Project::where('project_slug', $slug)->exists();

        return response()->json(['available' => ! $exists]);
    }

    public function show(int $accountIndex, Project $project): Response
    {
        $user = auth()->user();

        $membership = $user->projects()
            ->where('projects.project_id', $project->project_id)
            ->first();

        abort_if($membership === null, 403);

        $user->projects()->updateExistingPivot($project->project_id, [
            'opened_at' => now(),
        ]);

        // `project` and `projectRole` are exposed automatically as Inertia
        // shared data (see HandleInertiaRequests), so the page can read them
        // via `usePage().props` — no need to pass them here.
        return Inertia::render('projects/workspace');
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
