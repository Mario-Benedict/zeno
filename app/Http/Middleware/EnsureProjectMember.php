<?php

namespace App\Http\Middleware;

use App\Models\ChatRoom;
use App\Models\Note;
use App\Models\Project;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureProjectMember
{
    public function handle(Request $request, Closure $next): Response
    {
        /** @var Project|null $project */
        $project = $request->route('project');

        if (! $project instanceof Project) {
            abort(404);
        }

        if (! $project->isMember(Auth::id())) {
            abort(403, 'You are not a member of this project.');
        }

        $room = $request->route('room');

        if ($room instanceof ChatRoom && $room->project_id !== $project->project_id) {
            abort(404);
        }

        $note = $request->route('note');

        if ($note instanceof Note && $note->project_id !== $project->project_id) {
            abort(404);
        }

        return $next($request);
    }
}
