<?php

namespace App\Http\Controllers\Notes;

use App\Http\Controllers\Controller;
use App\Models\Note;
use App\Models\Project;
use App\Services\StorageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

/**
 * NoteImageController
 * ---------------------
 * Handles image uploads triggered from the editor's `/image` command or a
 * pasted/dropped file. Reuses the same StorageService already backing chat
 * media uploads instead of writing bespoke disk-handling logic.
 */
class NoteImageController extends Controller
{
    public function __construct(private readonly StorageService $storage) {}

    /**
     * POST /p/{project}/notes/{note}/images
     */
    public function store(Request $request, Project $project, Note $note): JsonResponse
    {
        abort_unless((string) $note->project_id === (string) $project->project_id, 404);
        Gate::authorize('update', $note);

        $validated = $request->validate([
            'image' => ['required', 'image', 'max:5120'],
        ]);

        $path = $this->storage->put($validated['image'], "notes/{$note->note_id}/images");

        return response()->json(['url' => $this->storage->url($path)], 201);
    }
}
