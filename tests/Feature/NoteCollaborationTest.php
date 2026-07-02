<?php

namespace Tests\Feature;

use App\Models\Note;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * Class NoteCollaborationTest
 *
 * Validates endpoint protection structures and structural authorization layers
 * across project boundaries, plus collaborator management and image uploads.
 */
class NoteCollaborationTest extends TestCase
{
    use RefreshDatabase;

    private function doc(string $text): array
    {
        return [
            'type' => 'doc',
            'content' => [
                ['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => $text]]],
            ],
        ];
    }

    #[Test]
    public function non_project_members_are_forbidden_from_viewing_the_workspace()
    {
        $owner = User::factory()->create();
        $unauthorizedUser = User::factory()->create();

        $project = Project::create(['project_name' => 'Project Zeno', 'project_slug' => 'zeno']);
        $project->members()->attach($owner->id);

        $this->actingAs($unauthorizedUser)
            ->get("/p/{$project->project_slug}/notes")
            ->assertStatus(403);
    }

    #[Test]
    public function authorized_members_can_create_shared_notes()
    {
        $user = User::factory()->create();
        $project = Project::create(['project_name' => 'Project Zeno', 'project_slug' => 'zeno']);
        $project->members()->attach($user->id);

        $response = $this->actingAs($user)
            ->postJson("/p/{$project->project_slug}/notes", [
                'title' => 'Strategic Sync Doc',
                'content' => $this->doc('Plan'),
                'is_shared' => true,
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('notes', [
            'project_id' => $project->project_id,
            'title' => 'Strategic Sync Doc',
            'is_shared' => true,
        ]);
    }

    #[Test]
    public function owner_can_add_a_project_member_as_a_collaborator()
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $project = Project::create(['project_name' => 'Project Zeno', 'project_slug' => 'zeno']);
        $project->members()->attach($owner->id);
        $project->members()->attach($member->id);

        $note = Note::create([
            'note_id' => (string) Str::uuid(), 'project_id' => $project->project_id,
            'user_id' => $owner->id, 'title' => 'Shared Doc', 'content' => $this->doc('x'),
            'is_shared' => true,
        ]);

        $this->actingAs($owner)
            ->postJson("/p/{$project->project_slug}/notes/{$note->note_id}/collaborators", [
                'user_id' => $member->id,
                'can_edit' => true,
            ])
            ->assertStatus(200);

        $this->assertDatabaseHas('note_collaborators', [
            'note_id' => $note->note_id,
            'user_id' => $member->id,
            'can_edit' => true,
        ]);
    }

    #[Test]
    public function non_owner_cannot_manage_collaborators()
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $project = Project::create(['project_name' => 'Project Zeno', 'project_slug' => 'zeno']);
        $project->members()->attach($owner->id);
        $project->members()->attach($other->id);

        $note = Note::create([
            'note_id' => (string) Str::uuid(), 'project_id' => $project->project_id,
            'user_id' => $owner->id, 'title' => 'Shared Doc', 'content' => $this->doc('x'),
            'is_shared' => true,
        ]);

        $this->actingAs($other)
            ->postJson("/p/{$project->project_slug}/notes/{$note->note_id}/collaborators", [
                'user_id' => $other->id,
                'can_edit' => true,
            ])
            ->assertStatus(403);
    }

    #[Test]
    public function a_viewer_collaborator_cannot_edit_but_an_editor_can()
    {
        $owner = User::factory()->create();
        $viewer = User::factory()->create();
        $editor = User::factory()->create();
        $project = Project::create(['project_name' => 'Project Zeno', 'project_slug' => 'zeno']);
        $project->members()->attach($owner->id);
        $project->members()->attach($viewer->id);
        $project->members()->attach($editor->id);

        $note = Note::create([
            'note_id' => (string) Str::uuid(), 'project_id' => $project->project_id,
            'user_id' => $owner->id, 'title' => 'Shared Doc', 'content' => $this->doc('x'),
            'is_shared' => true,
        ]);
        $note->collaborators()->attach($viewer->id, ['can_edit' => false]);
        $note->collaborators()->attach($editor->id, ['can_edit' => true]);

        $this->actingAs($viewer)
            ->patchJson("/p/{$project->project_slug}/notes/{$note->note_id}", ['title' => 'Nope'])
            ->assertStatus(403);

        $this->actingAs($editor)
            ->patchJson("/p/{$project->project_slug}/notes/{$note->note_id}", ['title' => 'Updated'])
            ->assertStatus(200);
    }

    #[Test]
    public function can_upload_an_image_into_a_note()
    {
        Storage::fake('public');

        $owner = User::factory()->create();
        $project = Project::create(['project_name' => 'Project Zeno', 'project_slug' => 'zeno']);
        $project->members()->attach($owner->id);

        $note = Note::create([
            'note_id' => (string) Str::uuid(), 'project_id' => $project->project_id,
            'user_id' => $owner->id, 'title' => 'Doc', 'content' => $this->doc('x'),
            'is_shared' => false,
        ]);

        $response = $this->actingAs($owner)
            ->postJson("/p/{$project->project_slug}/notes/{$note->note_id}/images", [
                'image' => UploadedFile::fake()->image('cover.png'),
            ]);

        $response->assertStatus(201)->assertJsonStructure(['url']);
    }
}
