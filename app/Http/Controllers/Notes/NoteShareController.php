<?php

namespace App\Http\Controllers\Notes;

use App\Events\NoteUpdated;
use App\Http\Controllers\Controller;
use App\Http\Requests\Notes\ShareNoteRequest;
use App\Models\Note;
use App\Models\Project;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

/**
 * NoteShareController
 * ---------------------
 * Promotes a personal note into a shared one — the "migrate to shared"
 * action the workspace's Share dialog triggers. Optionally seeds the
 * initial collaborator list in the same request instead of requiring a
 * second round trip through NoteCollaboratorController.
 *
 * Route prefix : /u/{accountIndex}/p/{project:project_slug}/notes/{note}/share
 * Middleware   : auth, verified, project.member (also scopes {note} to the project)
 */
class NoteShareController extends Controller
{
    use AuthorizesRequests;

    public function store(int $accountIndex, ShareNoteRequest $request, Project $project, Note $note): JsonResponse
    {
        $this->authorize('share', $note);

        $collaborators = collect($request->validated('collaborators', []))
            ->reject(fn (array $c) => (int) $c['user_id'] === (int) $note->user_id)
            ->mapWithKeys(fn (array $c) => [$c['user_id'] => ['can_edit' => $c['can_edit']]]);

        $note->update(['is_shared' => true]);

        if ($collaborators->isNotEmpty()) {
            $note->collaborators()->syncWithoutDetaching($collaborators->all());
        }

        $fresh = $note->fresh();

        // toOthers() needs a connected socket's ID (X-Socket-ID header, set by Echo);
        // skip exclusion when the caller has no active WebSocket connection.
        $broadcast = broadcast(new NoteUpdated($fresh, (string) Auth::id()));
        if (request()->hasHeader('X-Socket-ID')) {
            $broadcast->toOthers();
        }

        return response()->json(['note' => NoteController::formatDetail($fresh)]);
    }
}
