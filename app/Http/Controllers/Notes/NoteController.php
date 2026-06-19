<?php

namespace App\Http\Controllers\Notes;

use App\Http\Controllers\Controller;
use App\Events\NoteUpdated;
use App\Models\Note;
use App\Models\Project;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class NoteController extends Controller
{
    /**
     * Display a listing of personal workspace pages.
     */
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
            'type'         => 'personal',
            'projectSlug'  => $project->project_slug,
            'initialNotes' => $notes,
        ]);
    }

    /**
     * Display a listing of shared workspace pages.
     */
    public function shared(Request $request, Project $project): Response
    {
        $this->authorizeMember($request, $project);

        return Inertia::render('notes/NotesWorkspace', [
            'type'         => 'shared',
            'projectSlug'  => $project->project_slug,
            'initialNotes' => $this->getFormattedSharedNotes($project),
        ]);
    }

    /**
     * Store a newly created collaborative/personal resource in storage.
     */
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

    /**
     * Update the specified collaborative resource in storage.
     */
    public function update(Request $request, Project $project, Note $note): RedirectResponse
    {
        $this->authorizeMember($request, $project);

        // FIX PROTEKSI: Jika catatan bersifat personal/privat, hanya owner asli yang boleh mengedit
        if (!$note->is_shared && (int) $note->user_id !== (int) Auth::id()) {
            abort(403, 'Unauthorized action.');
        }

        $validated = $request->validate([
            'title'   => ['required', 'string', 'max:255'],
            'content' => ['required', 'array'],
        ]);

        $note->update([
            'title'   => $validated['title'],
            'content' => $validated['content'],
        ]);

        if ($note->is_shared) {
            broadcast(new NoteUpdated($note->fresh(), Auth::id()))->toOthers();
        }

        return redirect()->back()->with([
            'initialNotes' => $note->is_shared 
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

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, Project $project, Note $note): RedirectResponse
    {
        $this->authorizeMember($request, $project);

        // FIX PROTEKSI: Jika catatan bersifat personal/privat, hanya owner asli yang boleh menghapus
        if (!$note->is_shared && (int) $note->user_id !== (int) Auth::id()) {
            abort(403, 'Unauthorized action.');
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

    /**
     * Enforce strict membership verification on active workspaces.
     */
    private function authorizeMember(Request $request, Project $project): void
    {
        $isMember = $project->members()
            ->where('users.id', $request->user()->id)
            ->exists();

        // Menggunakan status kode 403 (Forbidden) secara eksplisit untuk mencegah eror namespace
        abort_unless($isMember, 403, 'Unauthorized access to project scope.');
    }

    private function formatNote(Note $note): array
    {
        return [
            'id'       => (string) $note->note_id, 
            'title'    => $note->title,
            'timeAgo'  => $note->updated_at ? $note->updated_at->diffForHumans() : 'Just now',
            'content'  => $note->content ?? ['html' => '', 'text' => ''],
            'isShared' => (bool) $note->is_shared,
            'userId'   => (string) $note->user_id,
        ];
    }
}