<?php

namespace App\Policies;

use App\Models\Note;
use App\Models\User;

/**
 * NotePolicy
 * -----------
 * Authorization rules for Note actions. Project membership itself is
 * enforced separately via `ProjectPolicy::view` on the route's `{project}`
 * binding (every note route is already scoped under `/p/{project}/...`) —
 * these rules only decide what a project member may do to a specific note.
 */
class NotePolicy
{
    /**
     * view — can the user open this note?
     * Personal notes are owner-only; shared notes are visible to any
     * project member (collaborator or not).
     */
    public function view(User $user, Note $note): bool
    {
        if (! $note->is_shared) {
            return $this->isOwner($user, $note);
        }

        return $this->isProjectMember($user, $note);
    }

    /**
     * update — can the user edit this note's title/content?
     * Owner always can. On a shared note, a collaborator may too, but only
     * if their pivot grants `can_edit`.
     */
    public function update(User $user, Note $note): bool
    {
        if ($this->isOwner($user, $note)) {
            return true;
        }

        if (! $note->is_shared) {
            return false;
        }

        return (bool) $note->collaborators()
            ->where('users.id', $user->id)
            ->wherePivot('can_edit', true)
            ->exists();
    }

    /**
     * delete — can the user delete this note?
     * Owner only, regardless of sharing state.
     */
    public function delete(User $user, Note $note): bool
    {
        return $this->isOwner($user, $note);
    }

    /**
     * manageCollaborators — can the user add/remove/change collaborators?
     * Owner only, and only once the note is actually shared.
     */
    public function manageCollaborators(User $user, Note $note): bool
    {
        return $note->is_shared && $this->isOwner($user, $note);
    }

    /**
     * share — can the user promote this note from personal to shared?
     * Owner only, and only while it's still personal.
     */
    public function share(User $user, Note $note): bool
    {
        return ! $note->is_shared && $this->isOwner($user, $note);
    }

    private function isOwner(User $user, Note $note): bool
    {
        return (int) $note->user_id === (int) $user->id;
    }

    private function isProjectMember(User $user, Note $note): bool
    {
        return $note->project->members()->where('users.id', $user->id)->exists();
    }
}
