<?php

use App\Models\Project;
use App\Models\Reminder;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    /** @var mixed $this */
    $this->user = User::factory()->create();
    $this->otherUser = User::factory()->create();

    $this->project = Project::create([
        'project_name' => 'Project Zeno',
        'project_slug' => 'zeno',
    ]);
    $this->project->members()->attach($this->user->id, ['role' => 'OWNER']);
    $this->project->members()->attach($this->otherUser->id, ['role' => 'MEMBER']);
});

function remindersUrl(Project $project, string $path = ''): string
{
    $suffix = $path === '' ? '' : "/{$path}";

    return "/u/0/p/{$project->project_slug}/reminders{$suffix}";
}

it('creates a manual reminder for the current user', function () {
    /** @var mixed $this */
    $this->actingAs($this->user)
        ->post(remindersUrl($this->project), [
            'reminder_title' => 'Ship the release',
            'reminder_due_at' => '2026-08-15 09:00:00',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('reminders', [
        'reminder_project_id' => $this->project->project_id,
        'reminder_user_id' => $this->user->id,
        'reminder_title' => 'Ship the release',
        'source' => 'manual',
        'is_completed' => false,
    ]);
});

it('updates a reminder title, description, due date, and completion', function () {
    /** @var mixed $this */
    $reminder = Reminder::create([
        'reminder_project_id' => $this->project->project_id,
        'reminder_user_id' => $this->user->id,
        'reminder_title' => 'Draft',
        'source' => 'manual',
    ]);

    $this->actingAs($this->user)
        ->patch(remindersUrl($this->project, $reminder->reminder_id), [
            'reminder_title' => 'Final draft',
            'reminder_description' => 'Wrap it up',
            'is_completed' => true,
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('reminders', [
        'reminder_id' => $reminder->reminder_id,
        'reminder_title' => 'Final draft',
        'reminder_description' => 'Wrap it up',
        'is_completed' => true,
    ]);
});

it('toggles pin state', function () {
    /** @var mixed $this */
    $reminder = Reminder::create([
        'reminder_project_id' => $this->project->project_id,
        'reminder_user_id' => $this->user->id,
        'reminder_title' => 'Pin me',
        'source' => 'manual',
    ]);

    $this->actingAs($this->user)
        ->patch(remindersUrl($this->project, "{$reminder->reminder_id}/pin"))
        ->assertRedirect();

    $this->assertDatabaseHas('reminders', [
        'reminder_id' => $reminder->reminder_id,
        'is_pinned' => true,
    ]);
});

it('deletes a reminder', function () {
    /** @var mixed $this */
    $reminder = Reminder::create([
        'reminder_project_id' => $this->project->project_id,
        'reminder_user_id' => $this->user->id,
        'reminder_title' => 'Delete me',
        'source' => 'manual',
    ]);

    $this->actingAs($this->user)
        ->delete(remindersUrl($this->project, $reminder->reminder_id))
        ->assertRedirect();

    $this->assertDatabaseMissing('reminders', ['reminder_id' => $reminder->reminder_id]);
});

it('prevents a project member from editing another member\'s reminder', function () {
    /** @var mixed $this */
    $reminder = Reminder::create([
        'reminder_project_id' => $this->project->project_id,
        'reminder_user_id' => $this->user->id,
        'reminder_title' => 'Private',
        'source' => 'manual',
    ]);

    $this->actingAs($this->otherUser)
        ->patch(remindersUrl($this->project, $reminder->reminder_id), [
            'reminder_title' => 'Hacked',
        ])
        ->assertForbidden();
});

it('only lists the current user\'s own reminders in this project', function () {
    /** @var mixed $this */
    Reminder::create([
        'reminder_project_id' => $this->project->project_id,
        'reminder_user_id' => $this->user->id,
        'reminder_title' => 'Mine',
        'source' => 'manual',
    ]);
    Reminder::create([
        'reminder_project_id' => $this->project->project_id,
        'reminder_user_id' => $this->otherUser->id,
        'reminder_title' => 'Not mine',
        'source' => 'manual',
    ]);

    $this->actingAs($this->user)
        ->get(remindersUrl($this->project))
        ->assertInertia(fn ($page) => $page
            ->component('reminders/index')
            ->has('reminders', 1)
            ->where('reminders.0.reminder_title', 'Mine')
        );
});

it('only exposes an owned reminder in the current project as a deep-link target', function () {
    /** @var mixed $this */
    $mine = Reminder::create([
        'reminder_project_id' => $this->project->project_id,
        'reminder_user_id' => $this->user->id,
        'reminder_title' => 'Mine',
        'source' => 'manual',
    ]);
    $otherUsers = Reminder::create([
        'reminder_project_id' => $this->project->project_id,
        'reminder_user_id' => $this->otherUser->id,
        'reminder_title' => 'Not mine',
        'source' => 'manual',
    ]);
    $otherProject = Project::create([
        'project_name' => 'Other Project',
        'project_slug' => 'other-project',
    ]);
    $otherProject->members()->attach($this->user->id, ['role' => 'OWNER']);
    $outsideProject = Reminder::create([
        'reminder_project_id' => $otherProject->project_id,
        'reminder_user_id' => $this->user->id,
        'reminder_title' => 'Outside project',
        'source' => 'manual',
    ]);

    $this->actingAs($this->user)
        ->get(remindersUrl($this->project)."?reminder={$mine->reminder_id}")
        ->assertInertia(fn ($page) => $page
            ->where('activeReminderId', $mine->reminder_id)
        );

    foreach ([$otherUsers, $outsideProject] as $inaccessibleReminder) {
        $this->actingAs($this->user)
            ->get(remindersUrl($this->project)."?reminder={$inaccessibleReminder->reminder_id}")
            ->assertInertia(fn ($page) => $page
                ->where('activeReminderId', null)
            );
    }
});
