<?php

namespace App\Http\Controllers\Notes;

use App\Events\NoteUpdated;
use App\Http\Controllers\Controller;
use App\Http\Requests\Notes\StoreNoteRequest;
use App\Http\Requests\Notes\UpdateNoteRequest;
use App\Models\Note;
use App\Models\Project;
use App\Models\User;
use App\Support\Notes\NoteExcerptExtractor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

/**
 * NoteController
 * ----------------
 * Personal and shared notes share a single workspace page (`notes/index`) —
 * there is no more route-per-tab split. `index()` renders the page shell
 * with a deliberately lightweight note list (no `content` column selected);
 * `show()` is a plain JSON endpoint the frontend calls on demand when a note
 * is actually opened, so the full block document is only ever fetched once
 * it's needed.
 */
class NoteController extends Controller
{
    /**
     * GET /p/{project}/notes
     *
     * Renders the notes workspace. Ships every note the user can see
     * (their own personal notes + every shared note in the project) as a
     * lightweight preview list, plus the project's member roster for the
     * share/collaborator picker.
     */
    public function index(Request $request, Project $project): Response
    {
        Gate::authorize('view', $project);

        $notes = Note::query()
            ->where('project_id', $project->project_id)
            ->where(function ($query) {
                $query->where('user_id', Auth::id())->orWhere('is_shared', true);
            })
            ->select(['note_id', 'title', 'excerpt', 'is_shared', 'user_id', 'updated_at'])
            ->withCount('collaborators')
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn (Note $note) => $this->formatListItem($note));

        return Inertia::render('notes/index', [
            'notes' => $notes,
            'projectUsers' => $project->members()->get(),
            'currentUserId' => (int) Auth::id(),
        ]);
    }

    /**
     * GET /p/{project}/notes/{note}
     *
     * On-demand fetch of a single note's full content, called when the
     * frontend opens it from the sidebar.
     */
    public function show(Request $request, Project $project, Note $note): JsonResponse
    {
        $this->assertBelongsToProject($project, $note);
        Gate::authorize('view', $note);

        return response()->json(['note' => $this->formatDetail($note)]);
    }

    public function store(StoreNoteRequest $request, Project $project): JsonResponse
    {
        Gate::authorize('view', $project);

        $validated = $request->validated();
        $content = $validated['content'] ?? self::emptyDocument();

        $note = Note::create([
            'user_id' => Auth::id(),
            'project_id' => $project->project_id,
            'title' => $validated['title'],
            'content' => $content,
            'excerpt' => NoteExcerptExtractor::extract($content),
            'is_shared' => $validated['is_shared'],
        ]);

        return response()->json(['note' => $this->formatDetail($note)], 201);
    }

    public function update(UpdateNoteRequest $request, Project $project, Note $note): JsonResponse
    {
        $this->assertBelongsToProject($project, $note);
        Gate::authorize('update', $note);

        $validated = $request->validated();
        $content = array_key_exists('content', $validated) ? $validated['content'] : $note->content;

        $note->update([
            'title' => $validated['title'] ?? $note->title,
            'content' => $content,
            'excerpt' => NoteExcerptExtractor::extract($content),
        ]);

        $fresh = $note->fresh();

        if ($fresh->is_shared) {
            broadcast(new NoteUpdated($fresh, (string) Auth::id()))->toOthers();
        }

        return response()->json(['note' => $this->formatDetail($fresh)]);
    }

    public function destroy(Project $project, Note $note): JsonResponse
    {
        $this->assertBelongsToProject($project, $note);
        Gate::authorize('delete', $note);

        $note->delete();

        return response()->json(['deleted' => true]);
    }

    private function assertBelongsToProject(Project $project, Note $note): void
    {
        abort_unless((string) $note->project_id === (string) $project->project_id, 404);
    }

    private function formatListItem(Note $note): array
    {
        return [
            'id' => (string) $note->note_id,
            'title' => $note->title,
            'excerpt' => $note->excerpt,
            'isShared' => (bool) $note->is_shared,
            'ownerId' => (int) $note->user_id,
            'updatedAt' => $note->updated_at?->toISOString(),
            'collaboratorsCount' => (int) $note->collaborators_count,
        ];
    }

    /**
     * Shared with NoteShareController/NoteCollaboratorController so every
     * endpoint that returns a note uses the exact same JSON shape.
     */
    public static function formatDetail(Note $note): array
    {
        return [
            'id' => (string) $note->note_id,
            'title' => $note->title,
            'content' => $note->content ?? self::emptyDocument(),
            'excerpt' => $note->excerpt,
            'isShared' => (bool) $note->is_shared,
            'ownerId' => (int) $note->user_id,
            'updatedAt' => $note->updated_at?->toISOString(),
            'collaborators' => $note->is_shared
                ? $note->collaborators()->get()->map(fn (User $user) => [
                    'id' => (int) $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'canEdit' => (bool) $user->pivot->can_edit,
                    'avatarUrl' => null,
                ])->toArray()
                : [],
        ];
    }

    public static function emptyDocument(): array
    {
        return ['type' => 'doc', 'content' => [['type' => 'paragraph']]];
    }
}
