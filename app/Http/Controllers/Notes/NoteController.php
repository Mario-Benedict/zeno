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
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

/**
 * NoteController
 * ----------------
 * Personal and shared notes share a single workspace page (`notes/index`) —
 * there is no route-per-tab split. `index()` renders the page shell with a
 * deliberately lightweight note list (no `content` column selected);
 * `show()` is a plain JSON endpoint the frontend calls on demand when a note
 * is actually opened, so the full block document is only ever fetched once
 * it's needed.
 *
 * Route prefix : /u/{accountIndex}/p/{project:project_slug}/notes
 * Middleware   : auth, verified, project.member (also scopes {note} to the project)
 */
class NoteController extends Controller
{
    use AuthorizesRequests;

    /**
     * GET /u/{accountIndex}/p/{project}/notes
     *
     * Ships every note the user can see (their own personal notes + every
     * shared note in the project) as a lightweight preview list, plus the
     * project's member roster for the share/collaborator picker.
     */
    public function index(int $accountIndex, Request $request, Project $project): Response
    {
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

        $requestedNoteId = $request->query('note');
        $activeNoteId = is_string($requestedNoteId)
            && $notes->contains(fn (array $note) => $note['id'] === $requestedNoteId)
                ? $requestedNoteId
                : null;

        return Inertia::render('notes/index', [
            'notes' => $notes,
            'projectUsers' => $project->members()->get(),
            'currentUserId' => (int) Auth::id(),
            'activeNoteId' => $activeNoteId,
        ]);
    }

    /**
     * GET /u/{accountIndex}/p/{project}/notes/{note}
     *
     * On-demand fetch of a single note's full content, called when the
     * frontend opens it from the sidebar.
     */
    public function show(int $accountIndex, Project $project, Note $note): JsonResponse
    {
        $this->authorize('view', $note);

        return response()->json(['note' => $this->formatDetail($note)]);
    }

    public function store(int $accountIndex, StoreNoteRequest $request, Project $project): JsonResponse
    {
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

    public function update(int $accountIndex, UpdateNoteRequest $request, Project $project, Note $note): JsonResponse
    {
        $this->authorize('update', $note);

        $validated = $request->validated();
        $content = array_key_exists('content', $validated) ? $validated['content'] : $note->content;
        $title = $validated['title'] ?? $note->title;
        $version = (int) ($validated['version'] ?? $note->version);

        // Editor extensions can emit transactions while hydrating a document.
        // Treat an identical payload as a successful no-op so it never bumps
        // the version, timestamp, or broadcasts an update to collaborators.
        if ($title === $note->title && $content == $note->content) {
            return response()->json(['note' => $this->formatDetail($note)]);
        }

        // Only save if this browser still has the latest document version.
        // This turns a concurrent edit into an explicit conflict rather than
        // silently overwriting the other collaborator's content.
        $updated = Note::query()
            ->where('note_id', $note->note_id)
            ->where('version', $version)
            ->update([
                'title' => $title,
                'content' => $content,
                'excerpt' => NoteExcerptExtractor::extract($content),
                'version' => $version + 1,
                'updated_at' => now(),
            ]);

        if ($updated === 0) {
            $latest = $note->fresh();

            return response()->json([
                'message' => 'This note changed before your edits could be saved.',
                'note' => $latest ? self::formatDetail($latest) : null,
            ], 409);
        }

        $fresh = $note->fresh();

        if ($fresh->is_shared) {
            // toOthers() needs a connected socket's ID (X-Socket-ID header, set by Echo);
            // skip exclusion when the caller has no active WebSocket connection. Check
            // the header's value, not just its presence: pusher-php-server rejects an
            // empty-but-present socket ID just as hard as a malformed one.
            $broadcast = broadcast(new NoteUpdated($fresh, (string) Auth::id()));
            if (preg_match('/^\d+\.\d+$/', (string) request()->header('X-Socket-ID')) === 1) {
                $broadcast->toOthers();
            }
        }

        return response()->json(['note' => $this->formatDetail($fresh)]);
    }

    public function destroy(int $accountIndex, Project $project, Note $note): JsonResponse
    {
        $this->authorize('delete', $note);

        $note->delete();

        return response()->json(['deleted' => true]);
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
            'version' => (int) $note->version,
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
