<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Note;
use App\Models\Project;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Class NoteCollaborationTest
 * 
 * Validates endpoint protection structures and structural authorization layers 
 * across project boundaries.
 */
class NoteCollaborationTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function non_project_members_are_forbidden_from_viewing_shared_notes()
    {
        $owner = User::factory()->create();
        $unauthorizedUser = User::factory()->create();

        $project = Project::factory()->create(['project_slug' => 'zeno']);
        $project->members()->attach($owner->id);

        $response = $this->actingAs($unauthorizedUser)
            ->get("/p/{$project->project_slug}/notes/shared");

        $response->assertStatus(403);
    }

    /** @test */
    public function authorized_members_can_create_shared_notes()
    {
        $user = User::factory()->create();
        $project = Project::factory()->create(['project_slug' => 'zeno']);
        $project->members()->attach($user->id);

        $response = $this->actingAs($user)
            ->post("/p/{$project->project_slug}/notes", [
                'title'     => 'Strategic Sync Doc',
                'content'   => ['html' => '<h1>Plan</h1>', 'text' => 'Plan'],
                'is_shared' => true,
            ]);

        $response->assertStatus(302);
        $this->assertDatabaseHas('notes', [
            'project_id' => $project->project_id,
            'title'      => 'Strategic Sync Doc',
            'is_shared'  => true,
        ]);
    }
}