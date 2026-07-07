<?php

use App\Models\CalendarEvent;
use App\Models\Project;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/**
 * Build the two-project scenario: Project Zeno (viewed) + Project Atlas
 * (source of a cross-project busy-block). Returns the actors and the event.
 */
function seedCalendarScenario(): array
{
    $mario = User::factory()->create(['name' => 'Mario']);
    $kevin = User::factory()->create(['name' => 'Kevin']);

    $zeno = Project::create(['project_name' => 'Zeno', 'project_slug' => 'zeno-test']);
    $zeno->members()->attach($mario->id, ['role' => 'OWNER', 'color' => '#D7CCC8']);
    $zeno->members()->attach($kevin->id, ['role' => 'MEMBER', 'color' => '#F8BBD0']);

    $atlas = Project::create(['project_name' => 'Atlas', 'project_slug' => 'atlas-test']);
    $atlas->members()->attach($mario->id, ['role' => 'OWNER', 'color' => '#D7CCC8']);

    $start = CarbonImmutable::now('UTC')->addDay()->setTime(9, 0);
    $secret = new CalendarEvent;
    $secret->project_id = $atlas->project_id;
    $secret->title = 'Review Kontrak Klien X';
    $secret->description = 'Top secret negotiation';
    $secret->start_time = $start;
    $secret->end_time = $start->addHours(2);
    $secret->priority = 'high';
    $secret->created_by = $mario->id;
    $secret->recurrence = 'none';
    $secret->save();
    $secret->participants()->attach($mario->id);

    return compact('mario', 'kevin', 'zeno', 'atlas', 'secret', 'start');
}

function eventsUrl(string $slug, CarbonImmutable $start, array $userIds): string
{
    $query = http_build_query([
        'start' => $start->copy()->subDay()->toIso8601String(),
        'end' => $start->copy()->addDays(2)->toIso8601String(),
        'users' => $userIds,
    ]);

    return "/u/0/p/{$slug}/calendar/events?{$query}";
}

it('hides other-project event details behind a CLASSIFIED block for non-participants', function () {
    ['mario' => $mario, 'kevin' => $kevin, 'zeno' => $zeno, 'start' => $start] = seedCalendarScenario();

    $response = $this->actingAs($kevin)
        ->withSession(['accounts' => [['user_id' => $kevin->id]], 'account_active_index' => 0])
        ->getJson(eventsUrl($zeno->project_slug, $start, [$mario->id, $kevin->id]))
        ->assertOk();

    $classified = collect($response->json())->firstWhere('is_classified', true);

    expect($classified)->not->toBeNull();
    expect($classified['participants'][0]['name'])->toBe('Mario');
    // Sensitive fields must never reach the wire.
    expect($classified)->not->toHaveKeys(['title', 'description', 'priority', 'project_id']);
});

it('shows full detail to the participant on any project they belong to', function () {
    ['mario' => $mario, 'zeno' => $zeno, 'start' => $start] = seedCalendarScenario();

    $response = $this->actingAs($mario)
        ->withSession(['accounts' => [['user_id' => $mario->id]], 'account_active_index' => 0])
        ->getJson(eventsUrl($zeno->project_slug, $start, [$mario->id]))
        ->assertOk();

    $own = collect($response->json())->firstWhere('title', 'Review Kontrak Klien X');

    expect($own)->not->toBeNull();
    expect($own['is_classified'])->toBeFalse();
    expect($own['priority'])->toBe('high');
});

it('expands a weekly recurring event into multiple occurrences', function () {
    ['mario' => $mario, 'zeno' => $zeno] = seedCalendarScenario();

    $anchor = CarbonImmutable::now('UTC')->next(CarbonImmutable::MONDAY)->setTime(10, 0);

    $this->actingAs($mario)
        ->withSession(['accounts' => [['user_id' => $mario->id]], 'account_active_index' => 0])
        ->postJson("/u/0/p/{$zeno->project_slug}/calendar/events", [
            'title' => 'Weekly Sync',
            'start_time' => $anchor->toIso8601String(),
            'end_time' => $anchor->addHour()->toIso8601String(),
            'priority' => 'mid',
            'recurrence' => 'weekly',
            'participants' => [$mario->id],
        ])
        ->assertCreated();

    $query = http_build_query([
        'start' => $anchor->copy()->subDay()->toIso8601String(),
        'end' => $anchor->copy()->addWeeks(3)->toIso8601String(),
        'users' => [$mario->id],
    ]);

    $response = $this->actingAs($mario)
        ->withSession(['accounts' => [['user_id' => $mario->id]], 'account_active_index' => 0])
        ->getJson("/u/0/p/{$zeno->project_slug}/calendar/events?{$query}")
        ->assertOk();

    $occurrences = collect($response->json())->where('title', 'Weekly Sync');

    expect($occurrences->count())->toBeGreaterThanOrEqual(3);
});

it('forbids a non-member from reading a project calendar', function () {
    ['zeno' => $zeno, 'start' => $start] = seedCalendarScenario();
    $outsider = User::factory()->create();

    $this->actingAs($outsider)
        ->withSession(['accounts' => [['user_id' => $outsider->id]], 'account_active_index' => 0])
        ->getJson(eventsUrl($zeno->project_slug, $start, [$outsider->id]))
        ->assertForbidden();
});
