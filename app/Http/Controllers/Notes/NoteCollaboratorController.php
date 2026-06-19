<?php

namespace App\Http\Controllers\Notes;

use App\Http\Controllers\Controller;
use App\Http\Requests\Notes\StoreNoteCollaboratorRequest;
use App\Models\Account;
use App\Models\Note;
use App\Models\NoteCollaborator;
use App\Models\Project;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;

/**
 * NoteCollaboratorController
 * ----------------------------
 * Handles adding/removing collaborators on a SHARED note, and changing
 * their role (editor / viewer). Only the note OWNER may manage
 * collaborators — this is enforced via Gate::authorize against the
 * Note model's account_id (NOT a separate policy class, to keep this
 * lean — promote to a NotePolicy later if rules grow).
 *
 * Route prefix : /p/{project:project_slug}/notes/{note}/collaborators
 * Middleware   : auth, verified, project.member
 */
class NoteCollaboratorController extends Controller
{
    /**
     * POST /p/{project}/notes/{note}/collaborators
     *
     * Adds a new collaborator (or updates the role if they're already one)
     * to a shared note. The target account MUST already be a project
     * member (checked via the accounts_projects pivot) — you can't add
     * someone outside the project as a collaborator.
     */
    public function store(StoreNoteCollaboratorRequest $request, Project $project, Note $note): RedirectResponse
    {
        $this->authorizeOwner($note);

        $validated = $request->validated();

        if ((int) $validated['user_id'] === $note->user_id) {
            return redirect()->back()->withErrors([
                'user_id' => 'The note owner already has full access.',
            ]);
        }

        $note->collaborators()->syncWithoutDetaching([
            $validated['user_id'] => ['can_edit' => $validated['can_edit']],
        ]);

        return redirect()->back();
    }

    /**
     * PATCH /p/{project}/notes/{note}/collaborators/{collaborator}
     *
     * Changes an existing collaborator's role (editor <-> viewer).
     */
    public function update(Request $request, Project $project, Note $note, int $user): RedirectResponse
    {
        $this->authorizeOwner($note);

        $request->validate(['can_edit' => ['required', 'boolean']]);

        $note->collaborators()->updateExistingPivot($user, [
            'can_edit' => $request->boolean('can_edit'),
        ]);

        return redirect()->back();
    }

    /**
     * DELETE /p/{project}/notes/{note}/collaborators/{collaborator}
     *
     * Removes a collaborator's access entirely.
     */
    public function destroy(Project $project, Note $note, int $user): RedirectResponse
    {
        $this->authorizeOwner($note);

        $note->collaborators()->detach($user);

        return redirect()->back();
    }

    /**
     * Only the note's owner can add/remove/change collaborators.
     * (Editors can edit CONTENT, but not the collaborator list itself.)
     */
    private function authorizeOwner(Note $note): void
    {
        Gate::allowIf(fn () => $note->user_id === Auth::id());
    }
}