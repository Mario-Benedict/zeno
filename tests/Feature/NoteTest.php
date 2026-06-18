<?php

use App\Models\User;
use App\Models\Note;
use App\Models\Project;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->project = Project::factory()->create(['slug' => 'zeno']);
    $this->project->users()->attach($this->user);
});

it('dapat memuat halaman personal notes dengan struktur data inertia', function () {
    Note::factory()->create([
        'project_id' => $this->project->id,
        'user_id' => $this->user->id,
        'title' => 'API Specs V2',
        'is_shared' => false
    ]);

    $this->actingAs($this->user)
        ->get("/p/{$this->project->slug}/notes/personal")
        ->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('notes/PersonalNotes')
            ->has('initialNotes')
            ->where('projectSlug', 'zeno')
        );
});

it('dapat membuat catatan baru dengan kondisi awal untitled', function () {
    $payload = [
        'title' => 'Untitled',
        'content' => ['html' => '', 'text' => ''],
        'is_shared' => false
    ];

    $this->actingAs($this->user)
        ->post("/p/{$this->project->slug}/notes", $payload)
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $this->assertDatabaseHas('notes', [
        'project_id' => $this->project->id,
        'title' => 'Untitled',
        'is_shared' => false
    ]);
});

it('dapat memperbarui isi catatan secara berkala melalui auto save', function () {
    $note = Note::factory()->create([
        'project_id' => $this->project->id,
        'user_id' => $this->user->id,
        'title' => 'Untitled',
    ]);

    $payload = [
        'title' => 'UX Feedback Updated',
        'content' => [
            'html' => '<h1>Heading 1</h1><p>Paragraph</p>',
            'text' => 'Heading 1 Paragraph'
        ]
    ];

    $this->actingAs($this->user)
        ->patch("/p/{$this->project->slug}/notes/{$note->id}", $payload)
        ->assertRedirect();

    $this->assertDatabaseHas('notes', [
        'id' => $note->id,
        'title' => 'UX Feedback Updated',
    ]);
});

it('dapat memindahkan catatan aktif ke dalam keranjang sampah trash bin', function () {
    $note = Note::factory()->create([
        'project_id' => $this->project->id,
        'user_id' => $this->user->id,
    ]);

    $this->actingAs($this->user)
        ->delete("/p/{$this->project->slug}/notes/{$note->id}")
        ->assertRedirect();

    $this->assertSoftDeleted('notes', [
        'id' => $note->id
    ]);
});