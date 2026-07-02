<?php

use App\Events\NoteUpdated;
use App\Models\Note;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

beforeEach(function () {
    /** @var mixed $this */
    $this->user1 = User::factory()->create(['name' => 'Mario']);
    $this->user2 = User::factory()->create(['name' => 'Evan']);
    $this->user3 = User::factory()->create(['name' => 'Kevin']);

    $this->project = Project::create([
        'project_name' => 'Project Zeno',
        'project_slug' => 'zeno',
    ]);

    $this->project->members()->attach($this->user1->id);
    $this->project->members()->attach($this->user2->id);
    $this->project->members()->attach($this->user3->id);
});

function noteDoc(string $text): array
{
    return [
        'type' => 'doc',
        'content' => [
            ['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => $text]]],
        ],
    ];
}

/* ==========================================================================
   1. WORKSPACE PAGE
   ========================================================================== */

it('loads the unified notes workspace with a lightweight note list', function () {
    /** @var mixed $this */
    Note::create([
        'note_id' => (string) Str::uuid(),
        'project_id' => $this->project->project_id,
        'user_id' => $this->user1->id,
        'title' => 'API Specs V2',
        'content' => noteDoc('Specs v2 content'),
        'excerpt' => 'Specs v2 content',
        'is_shared' => false,
    ]);

    $this->actingAs($this->user1)
        ->get("/p/{$this->project->project_slug}/notes")
        ->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('notes/index')
            ->has('notes')
            ->has('projectUsers')
            ->where('currentUserId', $this->user1->id)
        );
});

it('only lists your own personal notes but every shared note in the project', function () {
    /** @var mixed $this */
    Note::create([
        'note_id' => (string) Str::uuid(), 'project_id' => $this->project->project_id,
        'user_id' => $this->user1->id, 'title' => 'Mine', 'content' => noteDoc('mine'),
        'is_shared' => false,
    ]);
    Note::create([
        'note_id' => (string) Str::uuid(), 'project_id' => $this->project->project_id,
        'user_id' => $this->user2->id, 'title' => 'Not mine', 'content' => noteDoc('nope'),
        'is_shared' => false,
    ]);
    Note::create([
        'note_id' => (string) Str::uuid(), 'project_id' => $this->project->project_id,
        'user_id' => $this->user2->id, 'title' => 'Shared by Evan', 'content' => noteDoc('shared'),
        'is_shared' => true,
    ]);

    $this->actingAs($this->user1)
        ->get("/p/{$this->project->project_slug}/notes")
        ->assertInertia(fn ($page) => $page
            ->component('notes/index')
            ->has('notes', 2)
        );
});

/* ==========================================================================
   2. CRUD (JSON endpoints)
   ========================================================================== */

it('can create a new personal note with default state', function () {
    /** @var mixed $this */
    $this->actingAs($this->user1)
        ->postJson("/p/{$this->project->project_slug}/notes", [
            'title' => 'Untitled',
            'is_shared' => false,
        ])
        ->assertStatus(201)
        ->assertJsonPath('note.title', 'Untitled')
        ->assertJsonPath('note.isShared', false);

    $this->assertDatabaseHas('notes', [
        'project_id' => $this->project->project_id,
        'title' => 'Untitled',
        'is_shared' => false,
    ]);
});

it('can create a new shared note', function () {
    /** @var mixed $this */
    $this->actingAs($this->user1)
        ->postJson("/p/{$this->project->project_slug}/notes", [
            'title' => 'Untitled Shared Page',
            'is_shared' => true,
        ])
        ->assertStatus(201)
        ->assertJsonPath('note.isShared', true);

    $this->assertDatabaseHas('notes', [
        'project_id' => $this->project->project_id,
        'title' => 'Untitled Shared Page',
        'is_shared' => true,
    ]);
});

it('fetches full note content on demand via the show endpoint', function () {
    /** @var mixed $this */
    $note = Note::create([
        'note_id' => (string) Str::uuid(), 'project_id' => $this->project->project_id,
        'user_id' => $this->user1->id, 'title' => 'Doc', 'content' => noteDoc('hello world'),
        'excerpt' => 'hello world', 'is_shared' => false,
    ]);

    $this->actingAs($this->user1)
        ->getJson("/p/{$this->project->project_slug}/notes/{$note->note_id}")
        ->assertStatus(200)
        ->assertJsonPath('note.content.type', 'doc');
});

it('computes and stores a plain-text excerpt on update', function () {
    /** @var mixed $this */
    $note = Note::create([
        'note_id' => (string) Str::uuid(), 'project_id' => $this->project->project_id,
        'user_id' => $this->user1->id, 'title' => 'Doc', 'content' => noteDoc('old'),
        'is_shared' => true,
    ]);

    $this->actingAs($this->user1)
        ->patchJson("/p/{$this->project->project_slug}/notes/{$note->note_id}", [
            'title' => 'Doc',
            'content' => noteDoc('a brand new excerpt'),
        ])
        ->assertStatus(200)
        ->assertJsonPath('note.excerpt', 'a brand new excerpt');
});

it('does not garble the excerpt when a word is split across a mark boundary', function () {
    /** @var mixed $this */
    $note = Note::create([
        'note_id' => (string) Str::uuid(), 'project_id' => $this->project->project_id,
        'user_id' => $this->user1->id, 'title' => 'Doc', 'content' => noteDoc('old'),
        'is_shared' => false,
    ]);

    $splitWordDoc = [
        'type' => 'doc',
        'content' => [
            ['type' => 'paragraph', 'content' => [
                ['type' => 'text', 'text' => 'wor'],
                ['type' => 'text', 'marks' => [['type' => 'bold']], 'text' => 'ld'],
                ['type' => 'text', 'text' => ' says hello'],
            ]],
            ['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => 'Second block']]],
        ],
    ];

    $this->actingAs($this->user1)
        ->patchJson("/p/{$this->project->project_slug}/notes/{$note->note_id}", [
            'title' => 'Doc',
            'content' => $splitWordDoc,
        ])
        ->assertStatus(200)
        ->assertJsonPath('note.excerpt', 'world says hello Second block');
});

it('dispatches NoteUpdated when a shared note is modified', function () {
    /** @var mixed $this */
    Event::fake();

    $note = Note::create([
        'note_id' => (string) Str::uuid(), 'project_id' => $this->project->project_id,
        'user_id' => $this->user1->id, 'title' => 'Initial Shared Document',
        'content' => noteDoc(''), 'is_shared' => true,
    ]);

    $this->actingAs($this->user1)
        ->patchJson("/p/{$this->project->project_slug}/notes/{$note->note_id}", [
            'title' => 'Live Collab Text',
            'content' => noteDoc('typing live...'),
        ])
        ->assertStatus(200);

    Event::assertDispatched(NoteUpdated::class, function ($event) use ($note) {
        return (string) $event->note->note_id === (string) $note->note_id
            && $event->note->title === 'Live Collab Text';
    });
});

it('prevents another user from updating a private note they do not own', function () {
    /** @var mixed $this */
    $note = Note::create([
        'note_id' => (string) Str::uuid(), 'project_id' => $this->project->project_id,
        'user_id' => $this->user1->id, 'title' => 'Mario Private Secret',
        'content' => noteDoc('Original'), 'is_shared' => false,
    ]);

    $this->actingAs($this->user2)
        ->patchJson("/p/{$this->project->project_slug}/notes/{$note->note_id}", [
            'title' => 'Hacked By Evan',
            'content' => noteDoc('Hack'),
        ])
        ->assertForbidden();

    $this->assertDatabaseHas('notes', [
        'note_id' => $note->note_id,
        'title' => 'Mario Private Secret',
    ]);
});

it('can soft delete a note from the workspace', function () {
    /** @var mixed $this */
    $note = Note::create([
        'note_id' => (string) Str::uuid(), 'project_id' => $this->project->project_id,
        'user_id' => $this->user1->id, 'title' => 'Temporary Note',
        'content' => noteDoc('Trash'), 'is_shared' => false,
    ]);

    $this->actingAs($this->user1)
        ->deleteJson("/p/{$this->project->project_slug}/notes/{$note->note_id}")
        ->assertStatus(200)
        ->assertJson(['deleted' => true]);

    $this->assertSoftDeleted('notes', ['note_id' => $note->note_id]);
});

/* ==========================================================================
   3. SHARING (personal → shared migration)
   ========================================================================== */

it('lets the owner promote a personal note to shared and seed collaborators', function () {
    /** @var mixed $this */
    Event::fake();

    $note = Note::create([
        'note_id' => (string) Str::uuid(), 'project_id' => $this->project->project_id,
        'user_id' => $this->user1->id, 'title' => 'Draft', 'content' => noteDoc('draft'),
        'is_shared' => false,
    ]);

    $this->actingAs($this->user1)
        ->postJson("/p/{$this->project->project_slug}/notes/{$note->note_id}/share", [
            'collaborators' => [
                ['user_id' => $this->user2->id, 'can_edit' => true],
            ],
        ])
        ->assertStatus(200)
        ->assertJsonPath('note.isShared', true);

    $this->assertDatabaseHas('notes', ['note_id' => $note->note_id, 'is_shared' => true]);
    $this->assertDatabaseHas('note_collaborators', [
        'note_id' => $note->note_id,
        'user_id' => $this->user2->id,
        'can_edit' => true,
    ]);
});

it('prevents a non-owner from sharing someone else\'s note', function () {
    /** @var mixed $this */
    $note = Note::create([
        'note_id' => (string) Str::uuid(), 'project_id' => $this->project->project_id,
        'user_id' => $this->user1->id, 'title' => 'Draft', 'content' => noteDoc('draft'),
        'is_shared' => false,
    ]);

    $this->actingAs($this->user2)
        ->postJson("/p/{$this->project->project_slug}/notes/{$note->note_id}/share")
        ->assertForbidden();
});
