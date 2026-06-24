<?php

namespace App\Http\Controllers\Notes;

use App\Http\Controllers\Controller;
use App\Events\NoteUpdated;
use App\Models\Note;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class NoteController extends Controller
{
    public function personal(Request $request, Project $project): Response
    {
        $this->authorizeMember($request, $project);

        $notes = Note::query()
            ->where('project_id', $project->project_id)
            ->where('user_id', Auth::id())
            ->where('is_shared', false)
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn (Note $note) => $this->formatNote($note));

        return Inertia::render('notes/NotesWorkspace', [
            'type'          => 'personal',
            'projectSlug'   => $project->project_slug,
            'initialNotes'  => $notes,
            'currentUserId' => (int) Auth::id(),
        ]);
    }

    public function shared(Request $request, Project $project): Response
    {
        $this->authorizeMember($request, $project);

        return Inertia::render('notes/NotesWorkspace', [
            'type'          => 'shared',
            'projectSlug'   => $project->project_slug,
            'initialNotes'  => $this->getFormattedSharedNotes($project),
            'currentUserId' => (int) Auth::id(),
        ]);
    }

    public function store(Request $request, Project $project): RedirectResponse
    {
        $this->authorizeMember($request, $project);

        $validated = $request->validate([
            'title'     => ['required', 'string', 'max:255'],
            'content'   => ['nullable', 'array'],
            'is_shared' => ['required', 'boolean'],
        ]);

        Note::create([
            'user_id'    => Auth::id(),
            'project_id' => $project->project_id,
            'title'      => $validated['title'],
            'content'    => $validated['content'] ?? ['html' => '', 'text' => ''],
            'is_shared'  => $validated['is_shared'],
        ]);

        return redirect()->back()->with([
            'initialNotes' => $validated['is_shared']
                ? $this->getFormattedSharedNotes($project)
                : Note::query()
                    ->where('project_id', $project->project_id)
                    ->where('user_id', Auth::id())
                    ->where('is_shared', false)
                    ->orderByDesc('updated_at')
                    ->get()
                    ->map(fn (Note $note) => $this->formatNote($note))
                    ->toArray()
        ]);
    }

    public function update(Request $request, Project $project, Note $note): RedirectResponse
    {
        $this->authorizeMember($request, $project);

        if (!$note->is_shared && (int) $note->user_id !== (int) Auth::id()) {
            abort(403, 'Unauthorized action.');
        }

        if ($note->is_shared && (int) $note->user_id !== (int) Auth::id()) {
            // Cek di note_collaborators — bukan project_user
            $collaborator = $note->collaborators()
                ->where('users.id', Auth::id())
                ->first();

            if (!$collaborator || !$collaborator->pivot->can_edit) {
                abort(403, 'You have view-only access to this note.');
            }
        }

        $validated = $request->validate([
            'title'   => ['required', 'string', 'max:255'],
            'content' => ['nullable', 'array'],
        ]);

        $note->update([
            'title'   => $validated['title'],
            'content' => $validated['content'] ?? $note->content ?? ['html' => '', 'text' => ''],
        ]);

        if ($note->is_shared) {
            broadcast(new NoteUpdated($note->fresh(), (string) Auth::id()))->toOthers();
        }

        return redirect()->back();
    }

    public function destroy(Request $request, Project $project, Note $note): RedirectResponse
    {
        $this->authorizeMember($request, $project);

        if (!$note->is_shared && (int) $note->user_id !== (int) Auth::id()) {
            abort(403, 'Unauthorized action.');
        }

        if ($note->is_shared && (int) $note->user_id !== (int) Auth::id()) {
            abort(403, 'Only the note owner can delete this note.');
        }

        $isShared = (bool) $note->is_shared;
        $note->delete();

        return redirect()->back()->with([
            'initialNotes' => $isShared
                ? $this->getFormattedSharedNotes($project)
                : Note::query()
                    ->where('project_id', $project->project_id)
                    ->where('user_id', Auth::id())
                    ->where('is_shared', false)
                    ->orderByDesc('updated_at')
                    ->get()
                    ->map(fn (Note $note) => $this->formatNote($note))
                    ->toArray()
        ]);
    }

    private function getFormattedSharedNotes(Project $project): array
    {
        return Note::query()
            ->where('project_id', $project->project_id)
            ->where('is_shared', true)
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn (Note $note) => $this->formatNote($note))
            ->toArray();
    }

    private function authorizeMember(Request $request, Project $project): void
    {
        $isMember = $project->members()
            ->where('users.id', $request->user()->id)
            ->exists();

        abort_unless($isMember, 403, 'Unauthorized access to project scope.');
    }

    private function formatNote(Note $note): array
    {
        return [
            'id'            => (string) $note->note_id,
            'title'         => $note->title,
            'timeAgo'       => $note->updated_at ? $note->updated_at->diffForHumans() : 'Just now',
            'content'       => $note->content ?? ['html' => '', 'text' => ''],
            'is_shared'     => (bool) $note->is_shared,
            'ownerId'       => (int) $note->user_id,
            'collaborators' => $note->collaborators()
                ->get()
                ->map(fn (User $user) => [
                    'id'        => (int) $user->id,
                    'name'      => $user->name,
                    'email'     => $user->email,
                    'role'      => $user->pivot->can_edit ? 'Editor' : 'Viewer Only',
                    'avatarUrl' => null,
                ])
                ->toArray(),
        ];
    }
}