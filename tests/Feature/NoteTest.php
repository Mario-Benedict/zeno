<?php

use App\Models\User;
use App\Models\Project;
use App\Models\Note;
use App\Events\NoteUpdated;
use Illuminate\Support\Facades\Event;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

beforeEach(function () {
    /** @var mixed $this */

    // Membuat user testing
    $this->user1 = new User();
    $this->user1->name = 'Mario';
    $this->user1->email = 'mario@example.com';
    $this->user1->password = bcrypt('password123');
    $this->user1->email_verified_at = now();
    $this->user1->save();

    $this->user2 = new User();
    $this->user2->name = 'Evan';
    $this->user2->email = 'evan@example.com';
    $this->user2->password = bcrypt('password123');
    $this->user2->email_verified_at = now();
    $this->user2->save();

    $this->user3 = new User();
    $this->user3->name = 'Kevin';
    $this->user3->email = 'kevin@example.com';
    $this->user3->password = bcrypt('password123');
    $this->user3->email_verified_at = now();
    $this->user3->save();

    // Membuat project testing
    $this->project = new Project();
    $this->project->project_name = 'Project Zeno';
    $this->project->project_slug = 'zeno';
    $this->project->save();

    // Daftarkan semua user ke dalam project scope
    $this->project->members()->attach($this->user1->id);
    $this->project->members()->attach($this->user2->id);
    $this->project->members()->attach($this->user3->id);
});

/* ==========================================================================
   1. PERSONAL NOTES WORKSPACE TESTS
   ========================================================================== */

it('loads the personal notes page with the correct unified Inertia structure', function () {
    /** @var mixed $this */

    $note = Note::create([
        'note_id'    => (string) Str::uuid(),
        'project_id' => $this->project->project_id,
        'user_id'    => $this->user1->id,
        'title'      => 'API Specs V2',
        'content'    => ['html' => '<p>Specs v2 content</p>', 'text' => 'Specs v2 content'],
        'is_shared'  => false,
    ]);

    $this->actingAs($this->user1)
        ->get("/p/{$this->project->project_slug}/notes/personal")
        ->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('notes/NotesWorkspace')
            ->where('type', 'personal')
            ->has('initialNotes')
        );
});

it('can create a new personal note with default Untitled state', function () {
    /** @var mixed $this */

    $payload = [
        'title'     => 'Untitled',
        'content'   => ['html' => '', 'text' => ''],
        'is_shared' => false
    ];

    $this->actingAs($this->user1)
        ->post("/p/{$this->project->project_slug}/notes", $payload)
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $this->assertDatabaseHas('notes', [
        'project_id' => $this->project->project_id,
        'title'      => 'Untitled',
        'is_shared'  => false
    ]);
});

/* ==========================================================================
   2. SHARED NOTES WORKSPACE TESTS (GOOGLE DOCS FLOW)
   ========================================================================== */

it('loads the shared collaborative notes page with correct Inertia structure', function () {
    /** @var mixed $this */

    $note = Note::create([
        'note_id'    => (string) Str::uuid(),
        'project_id' => $this->project->project_id,
        'user_id'    => $this->user1->id,
        'title'      => 'Team Sprint Backlog',
        'content'    => ['html' => '<p>Backlog tasks</p>', 'text' => 'Backlog tasks'],
        'is_shared'  => true,
    ]);

    $this->actingAs($this->user1)
        ->get("/p/{$this->project->project_slug}/notes/shared")
        ->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('notes/NotesWorkspace')
            ->where('type', 'shared')
            ->has('initialNotes')
        );
});

it('can create a new collaborative shared note with default state', function () {
    /** @var mixed $this */

    $payload = [
        'title'     => 'Untitled Shared Page',
        'content'   => ['html' => '', 'text' => ''],
        'is_shared' => true
    ];

    $this->actingAs($this->user1)
        ->post("/p/{$this->project->project_slug}/notes", $payload)
        ->assertRedirect();

    $this->assertDatabaseHas('notes', [
        'project_id' => $this->project->project_id,
        'title'      => 'Untitled Shared Page',
        'is_shared'  => true
    ]);
});

/* ==========================================================================
   3. REAL-TIME EVENT BROADCASTING TESTS
   ========================================================================== */

it('dispatches NoteUpdated event to queue when a shared note is modified', function () {
    /** @var mixed $this */
    Event::fake();

    $note = Note::create([
        'note_id'    => (string) Str::uuid(), // FIX KUNCI: Menjamin ketersediaan UUID unik di SQLite Memori
        'project_id' => $this->project->project_id,
        'user_id'    => $this->user1->id,
        'title'      => 'Initial Shared Document',
        'content'    => ['html' => '', 'text' => ''],
        'is_shared'  => true,
    ]);

    $payload = [
        'title'   => 'Google Docs Live Collab Teks',
        'content' => [
            'html' => '<p>User Mario sedang mengetik teks ini secara live...</p>',
            'text' => 'User Mario sedang mengetik teks ini secara live...'
        ]
    ];

    $this->actingAs($this->user1)
        ->patch("/p/{$this->project->project_slug}/notes/{$note->note_id}", $payload)
        ->assertRedirect();

    Event::assertDispatched(NoteUpdated::class, function ($event) use ($note) {
        return (string) $event->note->note_id === (string) $note->note_id && 
               $event->note->title === 'Google Docs Live Collab Teks';
    });
});

/* ==========================================================================
   4. PROTECTION & SECURITY TESTS
   ========================================================================== */

it('prevents another user from updating a private note they do not own', function () {
    /** @var mixed $this */

    $note = Note::create([
        'note_id'    => (string) Str::uuid(),
        'project_id' => $this->project->project_id,
        'user_id'    => $this->user1->id,
        'title'      => 'Mario Private Secret',
        'content'    => ['html' => '<p>Original</p>', 'text' => 'Original'],
        'is_shared'  => false,
    ]);

    $payload = [
        'title'   => 'Hacked By Evan',
        'content' => ['html' => '<p>Hack</p>', 'text' => 'Hack'],
    ];

    $this->actingAs($this->user2)
        ->patch("/p/{$this->project->project_slug}/notes/{$note->note_id}", $payload)
        ->assertForbidden(); // Sekarang sukses menangkap kode 403 Forbidden!

    $this->assertDatabaseHas('notes', [
        'note_id' => $note->note_id,
        'title'   => 'Mario Private Secret',
    ]);
});

it('can soft delete a note safely from workspace', function () {
    /** @var mixed $this */

    $note = Note::create([
        'note_id'    => (string) Str::uuid(),
        'project_id' => $this->project->project_id,
        'user_id'    => $this->user1->id,
        'title'      => 'Temporary Note',
        'content'    => ['html' => '<p>Trash</p>', 'text' => 'Trash'],
        'is_shared'  => false,
    ]);

    $this->actingAs($this->user1)
        ->delete("/p/{$this->project->project_slug}/notes/{$note->note_id}")
        ->assertRedirect();

    $this->assertSoftDeleted('notes', [
        'note_id' => $note->note_id
    ]);
});