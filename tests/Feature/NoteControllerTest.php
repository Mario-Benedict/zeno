<?php

use App\Models\Note;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('unauthenticated user cannot access personal notes', function () {
    $this->get('/p/test-project/notes/personal')
        ->assertRedirect('/login');
});

test('authenticated user can access personal notes page', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/p/test-project/notes/personal')
        ->assertStatus(200);
});

test('personal notes only shows notes belonging to authenticated user', function () {
    $user  = User::factory()->create();
    $other = User::factory()->create();

    Note::factory()->create(['user_id' => $user->id,  'type' => 'personal', 'project_slug' => 'test-project']);
    Note::factory()->create(['user_id' => $other->id, 'type' => 'personal', 'project_slug' => 'test-project']);

    $this->actingAs($user)
        ->get('/p/test-project/notes/personal')
        ->assertInertia(fn ($page) => $page
            ->component('projects/Notes/PersonalNotes')
            ->has('initialNotes', 1)
        );
});

test('personal notes does not show shared type notes', function () {
    $user = User::factory()->create();

    Note::factory()->create(['user_id' => $user->id, 'type' => 'shared',   'project_slug' => 'test-project']);
    Note::factory()->create(['user_id' => $user->id, 'type' => 'personal', 'project_slug' => 'test-project']);

    $this->actingAs($user)
        ->get('/p/test-project/notes/personal')
        ->assertInertia(fn ($page) => $page
            ->has('initialNotes', 1)
        );
});