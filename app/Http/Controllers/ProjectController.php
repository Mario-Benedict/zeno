<?php

namespace App\Http\Controllers;

use App\Models\Project;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ProjectController extends Controller
{
    public function index(): Response
    {
        $user = auth()->user();

        $recentProjects = $user->projects()
            ->wherePivotNotNull('opened_at')
            ->orderByPivot('opened_at', 'desc')
            ->limit(4)
            ->get(['projects.project_id', 'projects.project_name', 'projects.project_slug'])
            ->map(fn ($p) => [
                'project_id'   => $p->project_id,
                'project_name' => $p->project_name,
                'project_slug' => $p->project_slug,
                'is_pinned'    => (bool) $p->pivot->is_pinned,
                'role'         => $p->pivot->role,
            ]);

        $paginated = $user->projects()
            ->orderByPivot('is_pinned', 'desc')
            ->orderBy('projects.project_name')
            ->paginate(5, ['projects.project_id', 'projects.project_name', 'projects.project_slug']);

        $projects = $paginated->through(fn ($p) => [
            'project_id'   => $p->project_id,
            'project_name' => $p->project_name,
            'project_slug' => $p->project_slug,
            'is_pinned'    => (bool) $p->pivot->is_pinned,
            'role'         => $p->pivot->role,
        ]);

        return Inertia::render('projects/index', [
            'recentProjects' => $recentProjects,
            'projects'       => $projects,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'project_name' => ['required', 'string', 'max:50', 'regex:/^[a-zA-Z0-9\- ]+$/'],
            'project_slug' => ['required', 'string', 'max:65', 'unique:projects,project_slug'],
        ]);

        $project = Project::create([
            'project_name' => trim($validated['project_name']),
            'project_slug' => $validated['project_slug'],
        ]);

        auth()->user()->projects()->attach($project->project_id, [
            'role'      => 'OWNER',
            'opened_at' => now(),
        ]);

        return redirect()->route('projects.show', $project->project_slug);
    }

    public function checkSlug(Request $request): JsonResponse
    {
        $slug = $request->query('slug', '');

        if (empty($slug)) {
            return response()->json(['available' => false]);
        }

        $exists = Project::where('project_slug', $slug)->exists();

        return response()->json(['available' => !$exists]);
    }

    public function show(Project $project): Response
    {
        $user = auth()->user();

        $membership = $user->projects()
            ->where('projects.project_id', $project->project_id)
            ->first();

        abort_if($membership === null, 403);

        $user->projects()->updateExistingPivot($project->project_id, [
            'opened_at' => now(),
        ]);

        return Inertia::render('projects/workspace', [
            'project' => [
                'project_id'   => $project->project_id,
                'project_name' => $project->project_name,
                'project_slug' => $project->project_slug,
            ],
            'role' => $membership->pivot->role,
        ]);
    }

    public function togglePin(Project $project): JsonResponse
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

        return response()->json(['is_pinned' => $newValue]);
    }

    private function generateUniqueSlug(string $base): string
    {
        $slug = Str::slug($base);

        if (! Project::where('project_slug', $slug)->exists()) {
            return $slug;
        }

        do {
            $candidate = $slug . '-' . Str::lower(Str::random(5));
        } while (Project::where('project_slug', $candidate)->exists());

        return $candidate;
    }
}
