<?php

namespace App\Http\Middleware;

use App\Enums\ProjectRole;
use App\Models\Project;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureProjectRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        /** @var Project|null $project */
        $project = $request->route('project');

        if (! $project instanceof Project) {
            abort(404);
        }

        $role = $project->roleFor(Auth::id());
        $allowedRoles = collect($roles)
            ->flatMap(fn (string $roleList) => explode(',', $roleList))
            ->map(fn (string $value) => strtoupper(trim($value)))
            ->filter()
            ->values()
            ->all();

        abort_unless(
            $role instanceof ProjectRole && in_array($role->value, $allowedRoles, true),
            403,
            'You do not have permission to manage this project.',
        );

        return $next($request);
    }
}
