<?php

namespace App\Http\Controllers\Notes;

use App\Http\Controllers\Controller;
use App\Http\Requests\Notes\StoreNoteCollaboratorRequest;
use App\Http\Requests\Notes\UpdateNoteCollaboratorRequest;
use App\Models\Note;
use App\Models\Project;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;

/**
 * NoteCollaboratorController
 * ----------------------------
 * Adds/removes collaborators on a shared note, and changes their role
 * (editor / viewer). Authorization goes through `NotePolicy::manageCollaborators`
 * — owner only, and only once the note is actually shared.
 *
 * Route prefix : /u/{accountIndex}/p/{project:project_slug}/notes/{note}/collaborators
 * Middleware   : auth, verified, project.member (also scopes {note} to the project)
 */
class NoteCollaboratorController extends Controller
{
    use AuthorizesRequests;

    /**
     * Adds a new collaborator (or updates the role if they're already one).
     * The target user must already be a project member — checked via the
     * `projectUsers` picker on the frontend and re-validated here.
     */
    public function store(int $accountIndex, StoreNoteCollaboratorRequest $request, Project $project, Note $note): JsonResponse
    {
        $this->authorize('manageCollaborators', $note);

        $validated = $request->validated();

        if ((int) $validated['user_id'] === (int) $note->user_id) {
            return response()->json(['message' => 'The note owner already has full access.'], 422);
        }

        abort_unless($project->isMember($validated['user_id']), 422, 'That user is not a member of this project.');

        $note->collaborators()->syncWithoutDetaching([
            $validated['user_id'] => ['can_edit' => $validated['can_edit']],
        ]);

        return response()->json(['note' => NoteController::formatDetail($note->fresh())]);
    }

    /**
     * Changes an existing collaborator's role (editor <-> viewer).
     */
    public function update(int $accountIndex, UpdateNoteCollaboratorRequest $request, Project $project, Note $note, int $user): JsonResponse
    {
        $this->authorize('manageCollaborators', $note);

        $note->collaborators()->updateExistingPivot($user, [
            'can_edit' => $request->boolean('can_edit'),
        ]);

        return response()->json(['note' => NoteController::formatDetail($note->fresh())]);
    }

    /**
     * Removes a collaborator's access entirely.
     */
    public function destroy(int $accountIndex, Project $project, Note $note, int $user): JsonResponse
    {
        $this->authorize('manageCollaborators', $note);

        $note->collaborators()->detach($user);

        return response()->json(['note' => NoteController::formatDetail($note->fresh())]);
    }
}
