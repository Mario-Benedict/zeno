<?php

namespace Tests\Feature;

use App\Models\Note;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Feature tests for NoteController (personal notes CRUD).
 *
 * Covers: personal, store, update, destroy (soft delete).
 */
class NoteControllerTest extends TestCase
{
    use RefreshDatabase;

    // ── Helpers ────────────────────────────────────────────────────────────────

    /** @return array{user: User, project: Project} */
    private function createUserWithProject(): array
    {
        $user    = User::factory()->create();
        $project = Project::factory()->create();

        $project->members()->attach($user->id, [
            'role'      => 'OWNER',
            'opened_at' => now(),
        ]);

        return compact('user', 'project');
    }

    private function noteUrl(Project $project, Note $note = null): string
    {
        $base = "/p/{$project->project_slug}/notes";
        return $note ? "{$base}/{$note->note_id}" : $base;
    }

    // ── personal (index) ───────────────────────────────────────────────────────

    /** @test */
    public function personal_returns_inertia_page_with_notes(): void
    {
        ['user' => $user, 'project' => $project] = $this->createUserWithProject();

        Note::factory()->count(3)->create([
            'user_id'    => $user->id,
            'project_id' => $project->project_id,
            'is_shared'  => false,
        ]);

        $this->actingAs($user)
            ->get("/p/{$project->project_slug}/notes/personal")
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Notes/PersonalNotes')
                ->has('initialNotes', 3)
                ->where('projectSlug', $project->project_slug),
            );
    }

    /** @test */
    public function personal_excludes_shared_notes(): void
    {
        ['user' => $user, 'project' => $project] = $this->createUserWithProject();

        Note::factory()->create([
            'user_id'    => $user->id,
            'project_id' => $project->project_id,
            'is_shared'  => true,
        ]);

        $this->actingAs($user)
            ->get("/p/{$project->project_slug}/notes/personal")
            ->assertInertia(fn ($page) => $page->has('initialNotes', 0));
    }

    /** @test */
    public function personal_excludes_other_users_notes(): void
    {
        ['user' => $user, 'project' => $project] = $this->createUserWithProject();
        $other = User::factory()->create();

        Note::factory()->create([
            'user_id'    => $other->id,
            'project_id' => $project->project_id,
            'is_shared'  => false,
        ]);

        $this->actingAs($user)
            ->get("/p/{$project->project_slug}/notes/personal")
            ->assertInertia(fn ($page) => $page->has('initialNotes', 0));
    }

    /** @test */
    public function personal_requires_authentication(): void
    {
        $project = Project::factory()->create();

        $this->get("/p/{$project->project_slug}/notes/personal")
            ->assertRedirect('/login');
    }

    /** @test */
    public function personal_forbids_non_members(): void
    {
        ['project' => $project] = $this->createUserWithProject();
        $outsider = User::factory()->create();

        $this->actingAs($outsider)
            ->get("/p/{$project->project_slug}/notes/personal")
            ->assertForbidden();
    }

    // ── store ──────────────────────────────────────────────────────────────────

    /** @test */
    public function store_creates_personal_note(): void
    {
        ['user' => $user, 'project' => $project] = $this->createUserWithProject();

        $this->actingAs($user)
            ->post($this->noteUrl($project), [
                'title'   => 'My Note',
                'content' => ['html' => '<p>Hello</p>', 'text' => 'Hello'],
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('notes', [
            'user_id'    => $user->id,
            'project_id' => $project->project_id,
            'title'      => 'My Note',
            'is_shared'  => false,
        ]);
    }

    /** @test */
    public function store_requires_title(): void
    {
        ['user' => $user, 'project' => $project] = $this->createUserWithProject();

        $this->actingAs($user)
            ->post($this->noteUrl($project), ['content' => ['html' => '']])
            ->assertSessionHasErrors('title');
    }

    /** @test */
    public function store_requires_authentication(): void
    {
        $project = Project::factory()->create();

        $this->post($this->noteUrl($project), ['title' => 'Test'])
            ->assertRedirect('/login');
    }

    /** @test */
    public function store_forbids_non_members(): void
    {
        ['project' => $project] = $this->createUserWithProject();
        $outsider = User::factory()->create();

        $this->actingAs($outsider)
            ->post($this->noteUrl($project), [
                'title'   => 'Hacked',
                'content' => ['html' => ''],
            ])
            ->assertForbidden();
    }

    // ── update ─────────────────────────────────────────────────────────────────

    /** @test */
    public function update_modifies_note(): void
    {
        ['user' => $user, 'project' => $project] = $this->createUserWithProject();

        $note = Note::factory()->create([
            'user_id'    => $user->id,
            'project_id' => $project->project_id,
            'title'      => 'Old Title',
            'is_shared'  => false,
        ]);

        $this->actingAs($user)
            ->patch($this->noteUrl($project, $note), [
                'title'   => 'New Title',
                'content' => ['html' => '<p>Updated</p>'],
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('notes', [
            'note_id' => $note->note_id,
            'title'   => 'New Title',
        ]);
    }

    /** @test */
    public function update_forbids_other_users(): void
    {
        ['project' => $project] = $this->createUserWithProject();
        $other = User::factory()->create();

        $note = Note::factory()->create([
            'user_id'    => User::factory()->create()->id,
            'project_id' => $project->project_id,
            'is_shared'  => false,
        ]);

        $this->actingAs($other)
            ->patch($this->noteUrl($project, $note), ['title' => 'Hacked'])
            ->assertForbidden();
    }

    // ── destroy ────────────────────────────────────────────────────────────────

    /** @test */
    public function destroy_soft_deletes_note(): void
    {
        ['user' => $user, 'project' => $project] = $this->createUserWithProject();

        $note = Note::factory()->create([
            'user_id'    => $user->id,
            'project_id' => $project->project_id,
            'is_shared'  => false,
        ]);

        $this->actingAs($user)
            ->delete($this->noteUrl($project, $note))
            ->assertRedirect();

        $this->assertSoftDeleted('notes', ['note_id' => $note->note_id]);
    }

    /** @test */
    public function destroy_forbids_other_users(): void
    {
        ['project' => $project] = $this->createUserWithProject();
        $other = User::factory()->create();

        $note = Note::factory()->create([
            'user_id'    => User::factory()->create()->id,
            'project_id' => $project->project_id,
            'is_shared'  => false,
        ]);

        $this->actingAs($other)
            ->delete($this->noteUrl($project, $note))
            ->assertForbidden();
    }
}