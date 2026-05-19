<?php

namespace App\Http\Controllers;

use App\Http\Resources\NoteResource;
use App\Models\Note;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class NoteController extends Controller
{
/**
 * Menampilkan halaman personal notes milik user yang sedang login.
 * Hanya menampilkan notes dengan type 'personal' dan user_id sesuai.
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

    /**
     * Menampilkan halaman shared notes beserta daftar collaborator.
     * Shared notes dapat dilihat oleh semua user yang sudah login.
     */
    public function shared(string $projectSlug = 'test-project'): Response
    {
        $notes = Note::where('type', 'shared')
            ->latest()
            ->get();

        $collaborators = User::all()->map(fn(User $user) => [
            'id'        => $user->id,
            'name'      => $user->name,
            'role'      => 'Editor',
            'avatarUrl' => null,
        ])->take(4)->values();

        return Inertia::render('projects/Notes/SharedNotes', [
            'projectSlug'   => $projectSlug,
            'initialNotes'  => NoteResource::collection($notes)->resolve(),
            'collaborators' => $collaborators,
        ]);
    }
}