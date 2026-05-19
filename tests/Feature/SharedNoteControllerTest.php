<?php

use App\Models\Note;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('unauthenticated user cannot access shared notes', function () {
    $this->get('/p/test-project/notes/shared')
        ->assertRedirect('/login');
});

test('authenticated user can access shared notes page', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/p/test-project/notes/shared')
        ->assertStatus(200);
});

test('shared notes shows all shared type notes regardless of owner', function () {
    $user  = User::factory()->create();
    $other = User::factory()->create();

    Note::factory()->create(['user_id' => $user->id,  'type' => 'shared', 'project_slug' => 'test-project']);
    Note::factory()->create(['user_id' => $other->id, 'type' => 'shared', 'project_slug' => 'test-project']);

    $this->actingAs($user)
        ->get('/p/test-project/notes/shared')
        ->assertInertia(fn ($page) => $page
            ->component('projects/Notes/SharedNotes')
            ->has('initialNotes', 2)
        );
});

test('shared notes does not show personal type notes', function () {
    $user = User::factory()->create();

    Note::factory()->create(['user_id' => $user->id, 'type' => 'personal', 'project_slug' => 'test-project']);
    Note::factory()->create(['user_id' => $user->id, 'type' => 'shared',   'project_slug' => 'test-project']);

    $this->actingAs($user)
        ->get('/p/test-project/notes/shared')
        ->assertInertia(fn ($page) => $page
            ->has('initialNotes', 1)
        );
});

test('shared notes page returns collaborators list', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/p/test-project/notes/shared')
        ->assertInertia(fn ($page) => $page
            ->component('projects/Notes/SharedNotes')
            ->has('collaborators')
        );
});