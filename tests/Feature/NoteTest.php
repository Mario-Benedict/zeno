<?php

use App\Models\Note;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function createUserWithProject(): array
{
    $user    = User::factory()->create();
    $project = Project::factory()->create();
    $project->members()->attach($user->id, [
        'role'      => 'OWNER',
        'opened_at' => now(),
    ]);

    return [$user, $project];
}

// ── Personal notes page ────────────────────────────────────────────────────────

test('member can view personal notes page', function () {
    [$user, $project] = createUserWithProject();

    $this->actingAs($user)
        ->get("/p/{$project->project_slug}/notes/personal")
        ->assertOk();
});

test('non-member cannot view personal notes page', function () {
    [, $project] = createUserWithProject();
    $other = User::factory()->create();

    $this->actingAs($other)
        ->get("/p/{$project->project_slug}/notes/personal")
        ->assertForbidden();
});

// ── Store ──────────────────────────────────────────────────────────────────────

test('member can create personal note', function () {
    [$user, $project] = createUserWithProject();

    $this->actingAs($user)
        ->post("/p/{$project->project_slug}/notes", [
            'title'   => 'Test Note',
            'content' => ['html' => '<p>Hello</p>', 'text' => 'Hello'],
        ])
        ->assertRedirect();

    expect(
        Note::where('title', 'Test Note')
            ->where('user_id', $user->id)
            ->exists()
    )->toBeTrue();
});

test('member cannot create note in project they do not belong to', function () {
    [, $project] = createUserWithProject();
    $outsider = User::factory()->create();

    $this->actingAs($outsider)
        ->post("/p/{$project->project_slug}/notes", [
            'title'   => 'Hacked',
            'content' => ['html' => ''],
        ])
        ->assertForbidden();
});

// ── Update ─────────────────────────────────────────────────────────────────────

test('member can update own note', function () {
    [$user, $project] = createUserWithProject();

    $note = Note::factory()->create([
        'user_id'    => $user->id,
        'project_id' => $project->project_id,
        'is_shared'  => false,
    ]);

    $this->actingAs($user)
        ->patch("/p/{$project->project_slug}/notes/{$note->note_id}", [
            'title' => 'Updated Title',
        ])
        ->assertRedirect();

    expect(
        Note::where('note_id', $note->note_id)->value('title')
    )->toBe('Updated Title');
});

test('member cannot update another users note', function () {
    [$user, $project] = createUserWithProject();
    $other = User::factory()->create();
    $project->members()->attach($other->id, ['role' => 'MEMBER', 'opened_at' => now()]);

    $note = Note::factory()->create([
        'user_id'    => $user->id,
        'project_id' => $project->project_id,
        'is_shared'  => false,
    ]);

    $this->actingAs($other)
        ->patch("/p/{$project->project_slug}/notes/{$note->note_id}", [
            'title' => 'Hacked',
        ])
        ->assertForbidden();
});

// ── Destroy ────────────────────────────────────────────────────────────────────

test('member can delete own note', function () {
    [$user, $project] = createUserWithProject();

    $note = Note::factory()->create([
        'user_id'    => $user->id,
        'project_id' => $project->project_id,
        'is_shared'  => false,
    ]);

    $this->actingAs($user)
        ->delete("/p/{$project->project_slug}/notes/{$note->note_id}")
        ->assertRedirect();

    expect(
        Note::withTrashed()->where('note_id', $note->note_id)->value('deleted_at')
    )->not->toBeNull();
});

test('member cannot delete another users note', function () {
    [$user, $project] = createUserWithProject();
    $other = User::factory()->create();
    $project->members()->attach($other->id, ['role' => 'MEMBER', 'opened_at' => now()]);

    $note = Note::factory()->create([
        'user_id'    => $user->id,
        'project_id' => $project->project_id,
        'is_shared'  => false,
    ]);

    $this->actingAs($other)
        ->delete("/p/{$project->project_slug}/notes/{$note->note_id}")
        ->assertForbidden();
});

// ── Shared notes page ──────────────────────────────────────────────────────────

test('member can view shared notes page', function () {
    [$user, $project] = createUserWithProject();

    $this->actingAs($user)
        ->get("/p/{$project->project_slug}/notes/shared")
        ->assertOk();
});

test('non-member cannot view shared notes page', function () {
    [, $project] = createUserWithProject();
    $other = User::factory()->create();

    $this->actingAs($other)
        ->get("/p/{$project->project_slug}/notes/shared")
        ->assertForbidden();
});