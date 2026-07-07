<?php

use App\Models\ChatRoom;
use App\Models\Project;
use App\Models\Reminder;
use App\Models\User;
use App\Services\ChatMessageService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

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

it('returns only the current user\'s due-or-overdue reminders in this project', function () {
    /** @var mixed $this */
    $overdue = Reminder::create([
        'reminder_project_id' => $this->project->project_id,
        'reminder_user_id' => $this->user->id,
        'reminder_title' => 'Overdue task',
        'reminder_due_at' => now()->subDay(),
        'source' => 'manual',
    ]);

    // Not due soon — shouldn't appear.
    Reminder::create([
        'reminder_project_id' => $this->project->project_id,
        'reminder_user_id' => $this->user->id,
        'reminder_title' => 'Far future task',
        'reminder_due_at' => now()->addMonth(),
        'source' => 'manual',
    ]);

    // Belongs to another user — shouldn't appear.
    Reminder::create([
        'reminder_project_id' => $this->project->project_id,
        'reminder_user_id' => $this->otherUser->id,
        'reminder_title' => 'Someone else\'s task',
        'reminder_due_at' => now()->subDay(),
        'source' => 'manual',
    ]);

    // Already completed — shouldn't appear.
    Reminder::create([
        'reminder_project_id' => $this->project->project_id,
        'reminder_user_id' => $this->user->id,
        'reminder_title' => 'Done task',
        'reminder_due_at' => now()->subDay(),
        'is_completed' => true,
        'source' => 'manual',
    ]);

    $response = $this->actingAs($this->user)
        ->getJson("/u/0/p/{$this->project->project_slug}/notifications")
        ->assertOk();

    $response->assertJsonCount(1, 'inbox');
    $response->assertJsonPath('inbox.0.reminder_id', $overdue->reminder_id);
    $response->assertJsonPath('inbox.0.is_overdue', true);
});

it('reports unread chat rooms via the existing chat schema', function () {
    /** @var mixed $this */
    $room = ChatRoom::create([
        'id' => (string) Str::uuid(),
        'project_id' => $this->project->project_id,
        'type' => 'group',
        'name' => 'General',
    ]);
    $room->participants()->attach($this->user->id, [
        'role' => 'member',
        'joined_at' => now(),
    ]);

    $this->mock(ChatMessageService::class, function ($mock) {
        $mock->shouldReceive('countUnread')->andReturn(3);
    });

    $response = $this->actingAs($this->user)
        ->getJson("/u/0/p/{$this->project->project_slug}/notifications")
        ->assertOk();

    $response->assertJsonCount(1, 'chat');
    $response->assertJsonPath('chat.0.id', $room->id);
    $response->assertJsonPath('chat.0.unread_count', 3);
});

it('excludes chat rooms with no unread messages', function () {
    /** @var mixed $this */
    $room = ChatRoom::create([
        'id' => (string) Str::uuid(),
        'project_id' => $this->project->project_id,
        'type' => 'group',
        'name' => 'General',
    ]);
    $room->participants()->attach($this->user->id, [
        'role' => 'member',
        'joined_at' => now(),
    ]);

    $this->mock(ChatMessageService::class, function ($mock) {
        $mock->shouldReceive('countUnread')->andReturn(0);
    });

    $response = $this->actingAs($this->user)
        ->getJson("/u/0/p/{$this->project->project_slug}/notifications")
        ->assertOk();

    $response->assertJsonCount(0, 'chat');
});
