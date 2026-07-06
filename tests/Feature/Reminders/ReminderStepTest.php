<?php

use App\Models\Project;
use App\Models\Reminder;
use App\Models\ReminderStep;
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

    $this->reminder = Reminder::create([
        'reminder_project_id' => $this->project->project_id,
        'reminder_user_id' => $this->user->id,
        'reminder_title' => 'Ship v1',
        'source' => 'manual',
    ]);
});

function reminderStepUrl(Project $project, string $reminderId, string $path = ''): string
{
    $suffix = $path === '' ? '' : "/{$path}";

    return "/u/0/p/{$project->project_slug}/reminders/{$reminderId}/steps{$suffix}";
}

it('adds a step to a reminder', function () {
    /** @var mixed $this */
    $this->actingAs($this->user)
        ->post(reminderStepUrl($this->project, $this->reminder->reminder_id), [
            'reminder_step_name' => 'Write tests',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('reminder_steps', [
        'reminder_id' => $this->reminder->reminder_id,
        'reminder_step_name' => 'Write tests',
        'is_completed' => false,
    ]);
});

it('toggles a step as completed', function () {
    /** @var mixed $this */
    $step = ReminderStep::create([
        'reminder_id' => $this->reminder->reminder_id,
        'reminder_step_name' => 'Write tests',
    ]);

    $this->actingAs($this->user)
        ->patch(reminderStepUrl($this->project, $this->reminder->reminder_id, $step->reminder_step_id), [
            'is_completed' => true,
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('reminder_steps', [
        'reminder_step_id' => $step->reminder_step_id,
        'is_completed' => true,
    ]);
});

it('deletes a step', function () {
    /** @var mixed $this */
    $step = ReminderStep::create([
        'reminder_id' => $this->reminder->reminder_id,
        'reminder_step_name' => 'Write tests',
    ]);

    $this->actingAs($this->user)
        ->delete(reminderStepUrl($this->project, $this->reminder->reminder_id, $step->reminder_step_id))
        ->assertRedirect();

    $this->assertDatabaseMissing('reminder_steps', ['reminder_step_id' => $step->reminder_step_id]);
});

it('prevents a non-owner from managing steps on someone else\'s reminder', function () {
    /** @var mixed $this */
    $this->actingAs($this->otherUser)
        ->post(reminderStepUrl($this->project, $this->reminder->reminder_id), [
            'reminder_step_name' => 'Sneaky step',
        ])
        ->assertForbidden();
});
