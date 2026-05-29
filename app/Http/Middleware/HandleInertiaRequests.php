<?php

namespace App\Http\Middleware;

use App\Models\Project;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared with every Inertia response.
     *
     * In addition to `auth`, we automatically expose `project` and
     * `projectRole` whenever the current route is bound to a project
     * (e.g. `/p/{slug}/...`). That way every workspace-scoped page can
     * read them straight from `usePage().props` with full type inference,
     * exactly like `auth.user`.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$project, $projectRole] = $this->resolveCurrentProject($request);

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $request->user(),
            ],
            'flash' => [
                'chat' => [
                    'newMessage' => $request->session()->get('chat.newMessage'),
                ],
            ],
            'project'     => $project,
            'projectRole' => $projectRole,
        ];
    }

    /**
     * Detect the project bound to the current route (via the
     * `{project:project_slug}` parameter) and the authenticated user's
     * role on it. Both values are `null` outside of a project-scoped
     * route — e.g. on `/projects` or `/login`.
     *
     * @return array{0: array<string, string>|null, 1: string|null}
     */
    private function resolveCurrentProject(Request $request): array
    {
        $route = $request->route();
        if ($route === null) {
            return [null, null];
        }

        $project = $route->parameter('project');
        if (! $project instanceof Project) {
            return [null, null];
        }

        $payload = [
            'project_id'   => $project->project_id,
            'project_name' => $project->project_name,
            'project_slug' => $project->project_slug,
        ];

        $user = $request->user();
        if ($user === null) {
            return [$payload, null];
        }

        $membership = $user->projects()
            ->where('projects.project_id', $project->project_id)
            ->first();

        return [$payload, $membership?->pivot->role];
    }
}
