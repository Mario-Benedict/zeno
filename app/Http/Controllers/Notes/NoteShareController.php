<?php

namespace App\Http\Controllers\Notes;

use App\Events\NoteUpdated;
use App\Http\Controllers\Controller;
use App\Http\Requests\Notes\ShareNoteRequest;
use App\Models\Note;
use App\Models\Project;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;

/**
 * NoteShareController
 * ---------------------
 * Promotes a personal note into a shared one — the "migrate to shared"
 * action the workspace's Share dialog triggers. Optionally seeds the
 * initial collaborator list in the same request instead of requiring a
 * second round trip through NoteCollaboratorController.
 */
class NoteShareController extends Controller
{
    /**
     * POST /p/{project}/notes/{note}/share
     */
    public function store(ShareNoteRequest $request, Project $project, Note $note): JsonResponse
    {
        abort_unless((string) $note->project_id === (string) $project->project_id, 404);
        Gate::authorize('share', $note);

        $collaborators = collect($request->validated('collaborators', []))
            ->reject(fn (array $c) => (int) $c['user_id'] === (int) $note->user_id)
            ->mapWithKeys(fn (array $c) => [$c['user_id'] => ['can_edit' => $c['can_edit']]]);

        $note->update(['is_shared' => true]);

        if ($collaborators->isNotEmpty()) {
            $note->collaborators()->syncWithoutDetaching($collaborators->all());
        }

        $fresh = $note->fresh();

        broadcast(new NoteUpdated($fresh, (string) Auth::id()))->toOthers();

        return response()->json(['note' => NoteController::formatDetail($fresh)]);
    }
}
