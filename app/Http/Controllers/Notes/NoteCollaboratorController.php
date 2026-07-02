<?php

namespace App\Http\Controllers\Notes;

use App\Http\Controllers\Controller;
use App\Http\Requests\Notes\StoreNoteCollaboratorRequest;
use App\Http\Requests\Notes\UpdateNoteCollaboratorRequest;
use App\Models\Note;
use App\Models\Project;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

/**
 * NoteCollaboratorController
 * ----------------------------
 * Adds/removes collaborators on a shared note, and changes their role
 * (editor / viewer). Authorization goes through `NotePolicy::manageCollaborators`
 * — owner only, and only once the note is actually shared.
 *
 * Route prefix : /p/{project:project_slug}/notes/{note}/collaborators
 * Middleware   : auth, verified
 */
class NoteCollaboratorController extends Controller
{
    /**
     * POST /p/{project}/notes/{note}/collaborators
     *
     * Adds a new collaborator (or updates the role if they're already one).
     * The target user must already be a project member — checked via the
     * `projectUsers` picker on the frontend and re-validated here.
     */
    public function store(StoreNoteCollaboratorRequest $request, Project $project, Note $note): JsonResponse
    {
        $this->assertBelongsToProject($project, $note);
        Gate::authorize('manageCollaborators', $note);

        $validated = $request->validated();

        if ((int) $validated['user_id'] === (int) $note->user_id) {
            return response()->json(['message' => 'The note owner already has full access.'], 422);
        }

        $isProjectMember = $project->members()->where('users.id', $validated['user_id'])->exists();
        abort_unless($isProjectMember, 422, 'That user is not a member of this project.');

        $note->collaborators()->syncWithoutDetaching([
            $validated['user_id'] => ['can_edit' => $validated['can_edit']],
        ]);

        return response()->json(['note' => NoteController::formatDetail($note->fresh())]);
    }

    /**
     * PATCH /p/{project}/notes/{note}/collaborators/{user}
     *
     * Changes an existing collaborator's role (editor <-> viewer).
     */
    public function update(UpdateNoteCollaboratorRequest $request, Project $project, Note $note, int $user): JsonResponse
    {
        $this->assertBelongsToProject($project, $note);
        Gate::authorize('manageCollaborators', $note);

        $note->collaborators()->updateExistingPivot($user, [
            'can_edit' => $request->boolean('can_edit'),
        ]);

        return response()->json(['note' => NoteController::formatDetail($note->fresh())]);
    }

    /**
     * DELETE /p/{project}/notes/{note}/collaborators/{user}
     *
     * Removes a collaborator's access entirely.
     */
    public function destroy(Project $project, Note $note, int $user): JsonResponse
    {
        $this->assertBelongsToProject($project, $note);
        Gate::authorize('manageCollaborators', $note);

        $note->collaborators()->detach($user);

        return response()->json(['note' => NoteController::formatDetail($note->fresh())]);
    }

    private function assertBelongsToProject(Project $project, Note $note): void
    {
        abort_unless((string) $note->project_id === (string) $project->project_id, 404);
    }
}
