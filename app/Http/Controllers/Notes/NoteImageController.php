<?php

namespace App\Http\Controllers\Notes;

use App\Http\Controllers\Controller;
use App\Models\Note;
use App\Models\Project;
use App\Services\StorageService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * NoteImageController
 * ---------------------
 * Handles image uploads triggered from the editor's `/image` command or a
 * pasted/dropped file. Reuses the same StorageService already backing chat
 * media uploads instead of writing bespoke disk-handling logic.
 *
 * Route prefix : /u/{accountIndex}/p/{project:project_slug}/notes/{note}/images
 * Middleware   : auth, verified, project.member (also scopes {note} to the project)
 */
class NoteImageController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private readonly StorageService $storage) {}

    public function store(int $accountIndex, Request $request, Project $project, Note $note): JsonResponse
    {
        $this->authorize('update', $note);

        $validated = $request->validate([
            'image' => ['required', 'image', 'max:5120'],
        ]);

        $path = $this->storage->put($validated['image'], "notes/{$note->note_id}/images");

        return response()->json(['url' => $this->storage->url($path)], 201);
    }
}
