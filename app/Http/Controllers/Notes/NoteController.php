<?php

namespace App\Http\Controllers\Notes;

use App\Http\Controllers\Controller;
use App\Models\Note;
use App\Models\Project;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class NoteController extends Controller
{
    /**
     * Ensure the current user is a member of the project (any role).
     * Aborts 403 otherwise.
     */
    private function authorizeMember(Request $request, Project $project): void
    {
        $isMember = $project->members()
            ->where('users.id', $request->user()->id)
            ->exists();

        abort_unless($isMember, HttpResponse::HTTP_FORBIDDEN);
    }

    /**
     * Personal notes page — only notes owned by current user, not shared.
     */
    public function personal(Request $request, Project $project): Response
    {
        $this->authorizeMember($request, $project);

        $notes = Note::query()
            ->where('project_id', $project->project_id)
            ->where('user_id', $request->user()->id)
            ->where('is_shared', false)
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn (Note $note) => $this->formatNote($note));

        return Inertia::render('notes/PersonalNotes', [
            'projectSlug' => $project->project_slug,
            'initialNotes' => $notes,
        ]);
    }

    public function store(Request $request, Project $project): RedirectResponse
    {
        $this->authorizeMember($request, $project);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'content' => ['nullable', 'array'],
            'is_shared' => ['boolean'],
        ]);

        Note::create([
            'user_id' => $request->user()->id,
            'project_id' => $project->project_id,
            'title' => $validated['title'],
            'content' => $validated['content'] ?? ['html' => '', 'text' => ''],
            'is_shared' => $validated['is_shared'] ?? false,
        ]);

        return back();
    }

    public function update(Request $request, Project $project, Note $note): RedirectResponse
    {
        abort_unless($note->project_id === $project->project_id, HttpResponse::HTTP_NOT_FOUND);
        abort_unless(
            $note->user_id === $request->user()->id,
            HttpResponse::HTTP_FORBIDDEN
        );

        $validated = $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
            'content' => ['nullable', 'array'],
        ]);

        $note->update([
            'title' => $validated['title'] ?? $note->title,
            'content' => $validated['content'] ?? $note->content,
        ]);

        return back();
    }

    /**
     * Soft-delete a note. There is no restore or trash-listing feature,
     * so once deleted the note is no longer reachable through the app —
     * but the delete operation itself must still succeed normally.
     */
    public function destroy(Request $request, Project $project, Note $note): RedirectResponse
    {
        abort_unless($note->project_id === $project->project_id, HttpResponse::HTTP_NOT_FOUND);
        abort_unless(
            $note->user_id === $request->user()->id,
            HttpResponse::HTTP_FORBIDDEN
        );

        $note->delete();

        return back();
    }

    private function formatNote(Note $note): array
    {
        return [
            'id' => $note->note_id,
            'title' => $note->title,
            'timeAgo' => $note->updated_at?->diffForHumans(),
            'content' => $note->content,
            'isShared' => $note->is_shared,
            'userId' => (string) $note->user_id,
        ];
    }
}