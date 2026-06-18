<?php

use App\Models\User;
use App\Models\Note;
use App\Models\Project;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    /** @var mixed $this */

    // Use 'new' + save() directly to bypass the $fillable guard for this test setup
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

    $this->project = new Project();
    $this->project->project_name = 'Project Zeno';
    $this->project->project_slug = 'zeno';
    $this->project->save();

    // Attach users to the official members() relation so NoteController authorizes them
    $this->project->members()->attach($this->user1->id);
    $this->project->members()->attach($this->user2->id);
    $this->project->members()->attach($this->user3->id);
});

it('loads the personal notes page with the correct Inertia data structure', function () {
    /** @var mixed $this */

    $note = new Note();
    $note->project_id = $this->project->project_id;
    $note->user_id = $this->user1->id;
    $note->title = 'API Specs V2';
    $note->content = ['html' => '<p>Specs v2 content</p>', 'text' => 'Specs v2 content'];
    $note->is_shared = false;
    $note->save();

    $this->actingAs($this->user1)
        ->get("/p/{$this->project->project_slug}/notes/personal")
        ->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('notes/PersonalNotes')
            ->has('initialNotes')
        );
});

it('can create a new note with default Untitled state', function () {
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

it('can update note content periodically via auto save', function () {
    /** @var mixed $this */

    $note = new Note();
    $note->project_id = $this->project->project_id;
    $note->user_id = $this->user1->id;
    $note->title = 'Untitled';
    $note->content = ['html' => '', 'text' => ''];
    $note->is_shared = false;
    $note->save();

    $payload = [
        'title'   => 'UX Feedback Updated',
        'content' => [
            'html' => '<h1>Heading 1</h1><p>Paragraph</p>',
            'text' => 'Heading 1 Paragraph'
        ]
    ];

    $this->actingAs($this->user1)
        ->patch("/p/{$this->project->project_slug}/notes/{$note->note_id}", $payload)
        ->assertRedirect();

    $this->assertDatabaseHas('notes', [
        'note_id' => $note->note_id,
        'title'   => 'UX Feedback Updated',
    ]);
});

it('moves an active note into the trash bin', function () {
    /** @var mixed $this */

    $note = new Note();
    $note->project_id = $this->project->project_id;
    $note->user_id = $this->user1->id;
    $note->title = 'Temporary Note';
    $note->content = ['html' => '<p>Trash</p>', 'text' => 'Trash'];
    $note->is_shared = false;
    $note->save();

    $this->actingAs($this->user1)
        ->delete("/p/{$this->project->project_slug}/notes/{$note->note_id}")
        ->assertRedirect();

    $this->assertSoftDeleted('notes', [
        'note_id' => $note->note_id
    ]);
});

it('prevents another user from updating a note they do not own', function () {
    /** @var mixed $this */

    // This note belongs to user1
    $note = new Note();
    $note->project_id = $this->project->project_id;
    $note->user_id = $this->user1->id;
    $note->title = 'Mario Private Note';
    $note->content = ['html' => '<p>Original</p>', 'text' => 'Original'];
    $note->is_shared = false;
    $note->save();

    $payload = [
        'title'   => 'Forcibly Changed By Evan',
        'content' => ['html' => '<p>Hack</p>', 'text' => 'Hack'],
    ];

    // user2 (Evan) attempts to update a note owned by user1 (Mario)
    $this->actingAs($this->user2)
        ->patch("/p/{$this->project->project_slug}/notes/{$note->note_id}", $payload)
        ->assertForbidden(); // must be 403

    // Confirm the title was NOT changed in the database
    $this->assertDatabaseHas('notes', [
        'note_id' => $note->note_id,
        'title'   => 'Mario Private Note',
    ]);

    $this->assertDatabaseMissing('notes', [
        'note_id' => $note->note_id,
        'title'   => 'Forcibly Changed By Evan',
    ]);
});