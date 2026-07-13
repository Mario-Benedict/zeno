<?php

use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;

uses(RefreshDatabase::class);

it('logs a completed request at info level for a successful response', function () {
    Log::spy();

    $this->get('/login')->assertOk();

    Log::shouldHaveReceived('info')
        ->withArgs(fn (string $message, array $context) => $message === 'GET /login 200'
            && $context['method'] === 'GET'
            && $context['path'] === '/login'
            && $context['status'] === 200
            && array_key_exists('duration_ms', $context)
            && array_key_exists('ip', $context)
            && array_key_exists('user_agent', $context))
        ->atLeast()->once();
});

it('logs a completed request at warning level for a 403', function () {
    // A truly unmatched URL 404s before any route (and therefore any
    // middleware, including this one) ever runs — Laravel's router rejects
    // it during route resolution itself. To exercise the logging middleware
    // for a non-2xx response, hit a real, matched, middleware-wrapped route
    // that the authenticated user is authorized to reach but not a member
    // of: EnsureProjectMember aborts(403) for that case, well after
    // LogRequestContext (prepended to the whole "web" group) has run.
    Log::spy();

    $user = User::factory()->create();
    $project = Project::create([
        'project_name' => 'Someone Elses Project',
        'project_slug' => Project::generateUniqueSlug('Someone Elses Project'),
        'avatar_color' => 'accent-blue',
    ]);

    $this->actingAs($user)
        ->withSession([
            'accounts' => [['user_id' => $user->id]],
            'account_active_index' => 0,
        ])
        ->get("/u/0/p/{$project->project_slug}/dashboard")
        ->assertForbidden();

    Log::shouldHaveReceived('warning')
        ->withArgs(fn (string $message, array $context) => str_ends_with($message, ' 403')
            && $context['status'] === 403)
        ->atLeast()->once();
});

it('includes the authenticated user id in the completed-request log', function () {
    Log::spy();

    $user = User::factory()->create();

    $this->actingAs($user)
        ->withSession([
            'accounts' => [['user_id' => $user->id]],
            'account_active_index' => 0,
        ])
        ->get('/u/0/projects')
        ->assertOk();

    Log::shouldHaveReceived('info')
        ->withArgs(fn (string $message, array $context) => str_starts_with($message, 'GET /u/0/projects')
            && $context['user_id'] === $user->id)
        ->atLeast()->once();
});
