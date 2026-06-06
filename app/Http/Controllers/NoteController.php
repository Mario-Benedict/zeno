<?php

namespace App\Http\Controllers;

use App\Http\Requests\Note\StoreNoteRequest;
use App\Http\Requests\Note\UpdateNoteRequest;
use App\Http\Resources\NoteResource;
use App\Models\Note;
use App\Models\Project;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

/**
 * NoteController
 *
 * Handles personal notes (is_shared = false) for the authenticated user
 * within a given project.
 *
 * Routes (web.php):
 *   GET    /p/{project:project_slug}/notes/personal  → personal()
 *   GET    /p/{project:project_slug}/notes/shared    → shared()
 *   POST   /p/{project:project_slug}/notes           → store()
 *   PATCH  /p/{project:project_slug}/notes/{note}    → update()
 *   DELETE /p/{project:project_slug}/notes/{note}    → destroy()
 */
class NoteController extends Controller
{
    // ── Helpers ────────────────────────────────────────────────────────────────

    /**
     * Abort with 403 if the authenticated user is not a member of the project.
     */
    private function authorizeProjectMember(Project $project): void
    {
        $isMember = Auth::user()
            ->projects()
            ->where('projects.project_id', $project->project_id)
            ->exists();

        abort_unless($isMember, 403);
    }

    /**
     * Fetch the current user's personal notes for a project, newest first.
     *
     * @return array<int, array<string, mixed>>
     */
    private function getPersonalNotes(Project $project): array
    {
        return NoteResource::collection(
            Note::where('project_id', $project->project_id)
                ->where('user_id', Auth::id())
                ->where('is_shared', false)
                ->orderByDesc('updated_at')
                ->get(),
        )->resolve();
    }

    // ── Actions ────────────────────────────────────────────────────────────────

    /**
     * GET /p/{project:project_slug}/notes/personal
     */
    public function personal(Project $project): Response
    {
        $this->authorizeProjectMember($project);

        return Inertia::render('projects/Notes/PersonalNotes', [
            'projectSlug'  => $project->project_slug,
            'initialNotes' => $this->getPersonalNotes($project),
        ]);
    }

    /**
     * GET /p/{project:project_slug}/notes/shared
     * Placeholder — implement shared notes later.
     */
    public function shared(Project $project): Response
    {
        $this->authorizeProjectMember($project);

        return Inertia::render('projects/Notes/SharedNotes', [
            'projectSlug' => $project->project_slug,
        ]);
    }

    /**
     * POST /p/{project:project_slug}/notes
     */
    public function store(StoreNoteRequest $request, Project $project): RedirectResponse
    {
        $this->authorizeProjectMember($project);

        Note::create([
            'user_id'    => Auth::id(),
            'project_id' => $project->project_id,
            'title'      => $request->validated('title'),
            'content'    => $request->validated('content'),
            'is_shared'  => false,
        ]);

        return back()->with('initialNotes', $this->getPersonalNotes($project));
    }

    /**
     * PATCH /p/{project:project_slug}/notes/{note:note_id}
     * Only the owner may update.
     */
    public function update(
        UpdateNoteRequest $request,
        Project $project,
        Note $note,
    ): RedirectResponse {
        abort_unless($note->user_id === Auth::id(), 403);

        $note->update($request->validated());

        return back()->with('initialNotes', $this->getPersonalNotes($project));
    }

    /**
     * DELETE /p/{project:project_slug}/notes/{note:note_id}
     * Soft-delete — moves to Trash.
     * Only the owner may delete.
     */
    public function destroy(Project $project, Note $note): RedirectResponse
    {
        abort_unless($note->user_id === Auth::id(), 403);

        $note->delete();

        return back()->with('initialNotes', $this->getPersonalNotes($project));
    }
}