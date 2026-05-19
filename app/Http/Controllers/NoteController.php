<?php

namespace App\Http\Controllers;

use App\Http\Resources\NoteResource;
use App\Models\Note;
use Inertia\Inertia;
use Inertia\Response;

class NoteController extends Controller
{
    /**
     * Menampilkan halaman personal notes.
     */
    public function personal(string $projectSlug = 'test-project'): Response
    {
        $notes = Note::where('user_id', auth()->id())
            ->where('type', 'personal')
            ->latest()
            ->get();

        return Inertia::render('projects/Notes/PersonalNotes', [
            'projectSlug'  => $projectSlug,
            'initialNotes' => NoteResource::collection($notes)->resolve(),
        ]);
    }
}