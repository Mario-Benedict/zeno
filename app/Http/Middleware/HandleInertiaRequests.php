<?php

namespace App\Http\Middleware;

use App\Enums\ProjectRole;
use App\Models\Project;
use App\Models\ProjectInvitation;
use App\Models\User;
use App\Services\AccountSessionService;
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
            'account' => $this->resolveAccount($request),
            'accountsList' => fn () => AccountSessionService::accountsList($request),
            'flash' => [
                'chat' => [
                    'newMessage' => $request->session()->get('chat.newMessage'),
                ],
                'status' => $request->session()->get('status'),
            ],
            'project' => $project,
            'projectRole' => $projectRole,
            'projectNavigation' => fn () => $this->resolveProjectNavigation($request),
            'projectShare' => fn () => $this->resolveProjectShare($request),
        ];
    }

    /**
     * @return array{index: int, baseUrl: string}
     */
    private function resolveAccount(Request $request): array
    {
        $accountIndex = max(0, (int) $request->attributes->get('account.index', 0));

        return [
            'index' => $accountIndex,
            'baseUrl' => '/u/'.$accountIndex,
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
            'project_id' => $project->project_id,
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

    /**
     * @return array{projects: list<array<string, mixed>>}
     */
    private function resolveProjectNavigation(Request $request): array
    {
        $user = $request->user();

        if (! $user instanceof User) {
            return ['projects' => []];
        }

        $projects = $user->projects()
            ->orderByPivot('is_pinned', 'desc')
            ->orderByPivot('opened_at', 'desc')
            ->orderBy('projects.project_name')
            ->limit(8)
            ->get(['projects.project_id', 'projects.project_name', 'projects.project_slug'])
            ->map(fn (Project $project) => [
                'project_id' => $project->project_id,
                'project_name' => $project->project_name,
                'project_slug' => $project->project_slug,
                'is_pinned' => (bool) $project->pivot->is_pinned,
                'role' => $project->pivot->role,
            ])
            ->values()
            ->all();

        return ['projects' => $projects];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function resolveProjectShare(Request $request): ?array
    {
        $route = $request->route();
        $project = $route?->parameter('project');

        if (! $project instanceof Project) {
            return null;
        }

        $user = $request->user();
        $role = $user instanceof User ? $project->roleFor($user) : null;
        $canManageMembers = $role?->canManageMembers() ?? false;

        $members = $project->members()
            ->select(['users.id', 'users.name', 'users.email'])
            ->orderByRaw("CASE project_user.role WHEN 'OWNER' THEN 0 WHEN 'ADMIN' THEN 1 WHEN 'MEMBER' THEN 2 ELSE 3 END")
            ->orderBy('users.name')
            ->get()
            ->map(fn (User $member) => [
                'id' => $member->id,
                'name' => $member->name,
                'email' => $member->email,
                'role' => $member->pivot->role,
                'is_current_user' => $user instanceof User && (int) $member->id === (int) $user->id,
            ])
            ->values()
            ->all();

        $pendingInvitations = $canManageMembers
            ? $project->invitations()
                ->whereNull('accepted_at')
                ->latest()
                ->limit(8)
                ->get()
                ->map(fn (ProjectInvitation $invitation) => [
                    'id' => $invitation->id,
                    'email' => $invitation->email,
                    'name' => $invitation->name,
                    'role' => $invitation->role,
                    'url' => route('projects.invitations.accept', $invitation->token),
                    'expires_at' => $invitation->expires_at?->toIso8601String(),
                ])
                ->values()
                ->all()
            : [];

        return [
            'can_manage_members' => $canManageMembers,
            'assignable_roles' => ProjectRole::assignableValues(),
            'invitation_link' => $project->invitation_link === null
                ? null
                : [
                    'url' => route('projects.invitations.accept', $project->invitation_link),
                    'role' => $project->invitation_role ?? ProjectRole::Member->value,
                ],
            'members' => $members,
            'pending_invitations' => $pendingInvitations,
        ];
    }
}
