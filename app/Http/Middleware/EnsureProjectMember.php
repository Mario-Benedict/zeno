<?php

namespace App\Http\Middleware;

use App\Models\ChatRoom;
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

        $userId = Auth::id();

        $isMember = ChatRoom::query()
            ->where('project_id', $project->project_id)
            ->where('type', 'group')
            ->whereHas('participants', fn ($q) => $q->where('user_id', $userId))
            ->exists();

        if (! $isMember) {
            abort(403, 'You are not a member of this project.');
        }


        /** @var ChatRoom|null $room */
        $room = $request->route('room');

        if ($room instanceof ChatRoom && $room->project_id !== $project->project_id) {
            abort(404);
        }

        return $next($request);
    }
}