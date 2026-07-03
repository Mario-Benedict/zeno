<?php

use App\Enums\ProjectRole;
use App\Models\ChatRoom;
use App\Models\KanbanBoard;
use App\Models\Project;
use App\Models\User;
use App\Models\UserDashboardSetting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

it('creates a dashboard setting on first visit and does not include kanban data by default', function () {
    $user = User::factory()->create();
    $project = Project::create([
        'project_name' => 'Test Project',
        'project_slug' => Project::generateUniqueSlug('Test Project'),
        'avatar_color' => 'accent-blue',
    ]);
    $project->members()->attach($user->id, ['role' => ProjectRole::Owner->value]);

    $this->actingAs($user)
        ->withSession([
            'accounts' => [['user_id' => $user->id]],
            'account_active_index' => 0,
        ])
        ->get("/u/0/p/{$project->project_slug}/dashboard")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->where('setting.template_id', null)
            ->missing('kanbanWidgetData')
        );

    expect(UserDashboardSetting::where('user_id', $user->id)
        ->where('project_id', $project->project_id)
        ->exists())->toBeTrue();
});

it('persists the selected template and resets slots when the template changes', function () {
    $user = User::factory()->create();
    $project = Project::create([
        'project_name' => 'Test Project',
        'project_slug' => Project::generateUniqueSlug('Test Project'),
        'avatar_color' => 'accent-blue',
    ]);
    $project->members()->attach($user->id, ['role' => ProjectRole::Owner->value]);

    $session = [
        'accounts' => [['user_id' => $user->id]],
        'account_active_index' => 0,
    ];

    $this->actingAs($user)
        ->withSession($session)
        ->patch("/u/0/p/{$project->project_slug}/dashboard", ['template_id' => '4a'])
        ->assertRedirect();

    $setting = UserDashboardSetting::where('user_id', $user->id)
        ->where('project_id', $project->project_id)
        ->first();

    expect($setting->template_id)->toBe('4a');

    $this->actingAs($user)
        ->withSession($session)
        ->patch("/u/0/p/{$project->project_slug}/dashboard", ['template_id' => '5a'])
        ->assertRedirect();

    $setting->refresh();
    expect($setting->template_id)->toBe('5a');
    expect($setting->slots)->toBeNull();
});

it('assigns a widget to a slot and returns kanban data once assigned', function () {
    $user = User::factory()->create();
    $project = Project::create([
        'project_name' => 'Test Project',
        'project_slug' => Project::generateUniqueSlug('Test Project'),
        'avatar_color' => 'accent-blue',
    ]);
    $project->members()->attach($user->id, ['role' => ProjectRole::Owner->value]);

    KanbanBoard::create([
        'kanban_board_project_id' => $project->project_id,
        'kanban_board_name' => 'Todo',
        'kanban_board_position' => 0,
    ]);

    $session = [
        'accounts' => [['user_id' => $user->id]],
        'account_active_index' => 0,
    ];

    $this->actingAs($user)
        ->withSession($session)
        ->patch("/u/0/p/{$project->project_slug}/dashboard/slots", [
            'index' => 0,
            'widget' => 'kanban',
        ])
        ->assertRedirect();

    $setting = UserDashboardSetting::where('user_id', $user->id)
        ->where('project_id', $project->project_id)
        ->first();

    expect($setting->slots)->toBe(['kanban']);

    $this->actingAs($user)
        ->withSession($session)
        ->get("/u/0/p/{$project->project_slug}/dashboard")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->where('setting.slots', ['kanban'])
            ->has('kanbanWidgetData.kanbanBoards', 1)
        );
});

it('assigns the chat widget to a slot and returns room data once assigned', function () {
    $user = User::factory()->create();
    $project = Project::create([
        'project_name' => 'Test Project',
        'project_slug' => Project::generateUniqueSlug('Test Project'),
        'avatar_color' => 'accent-blue',
    ]);
    $project->members()->attach($user->id, ['role' => ProjectRole::Owner->value]);

    $room = ChatRoom::create([
        'project_id' => $project->project_id,
        'type' => 'group',
        'name' => $project->project_name,
    ]);
    $room->participants()->attach($user->id, [
        'role' => 'admin',
        'is_muted' => false,
        'joined_at' => now(),
    ]);

    $session = [
        'accounts' => [['user_id' => $user->id]],
        'account_active_index' => 0,
    ];

    $this->actingAs($user)
        ->withSession($session)
        ->patch("/u/0/p/{$project->project_slug}/dashboard/slots", [
            'index' => 0,
            'widget' => 'chat',
        ])
        ->assertRedirect();

    $setting = UserDashboardSetting::where('user_id', $user->id)
        ->where('project_id', $project->project_id)
        ->first();

    expect($setting->slots)->toBe(['chat']);

    $this->actingAs($user)
        ->withSession($session)
        ->get("/u/0/p/{$project->project_slug}/dashboard")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->where('setting.slots', ['chat'])
            ->has('chatWidgetData.rooms', 1)
            ->where('chatWidgetData.currentUser.id', (string) $user->id)
        );
});

it('rejects an unimplemented widget for a slot', function () {
    $user = User::factory()->create();
    $project = Project::create([
        'project_name' => 'Test Project',
        'project_slug' => Project::generateUniqueSlug('Test Project'),
        'avatar_color' => 'accent-blue',
    ]);
    $project->members()->attach($user->id, ['role' => ProjectRole::Owner->value]);

    $this->actingAs($user)
        ->withSession([
            'accounts' => [['user_id' => $user->id]],
            'account_active_index' => 0,
        ])
        ->patch("/u/0/p/{$project->project_slug}/dashboard/slots", [
            'index' => 0,
            'widget' => 'notes',
        ])
        ->assertSessionHasErrors('widget');
});
