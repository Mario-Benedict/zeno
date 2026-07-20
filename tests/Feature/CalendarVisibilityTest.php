<?php

use App\Models\CalendarEvent;
use App\Models\Project;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/**
 * Two projects: Zeno (viewer's project) and Atlas (owns the event under
 * test). Both users are in Zeno so the creator is a valid member-filter
 * target; the event itself belongs to Atlas and therefore still goes through
 * getClassifiedEvents()'s cross-project branch.
 */
function seedVisibilityScenario(string $creatorVisibility): array
{
    $creator = User::factory()->create(['name' => 'Creator', 'calendar_visibility' => $creatorVisibility]);
    $viewer = User::factory()->create(['name' => 'Viewer']);

    $zeno = Project::create(['project_name' => 'Zeno', 'project_slug' => 'zeno-vis']);
    $zeno->members()->attach($viewer->id, ['role' => 'OWNER', 'color' => '#D7CCC8']);
    $zeno->members()->attach($creator->id, ['role' => 'MEMBER', 'color' => '#7B7B7B']);

    $atlas = Project::create(['project_name' => 'Atlas', 'project_slug' => 'atlas-vis']);
    $atlas->members()->attach($creator->id, ['role' => 'OWNER', 'color' => '#D7CCC8']);

    // The viewer must also share the Atlas project so they're a candidate
    // "user" in the events query (getClassifiedEvents() looks at users the
    // viewer has crossover with) — attach them as a member there too, but
    // NOT as a participant on the event itself, so they hit the
    // non-participant / classified branch.
    $atlas->members()->attach($viewer->id, ['role' => 'MEMBER', 'color' => '#F8BBD0']);

    $start = CarbonImmutable::now('UTC')->addDay()->setTime(9, 0);
    $event = new CalendarEvent;
    $event->project_id = $atlas->project_id;
    $event->title = 'Confidential planning session';
    $event->description = 'Sensitive details';
    $event->start_time = $start;
    $event->end_time = $start->addHours(2);
    $event->created_by = $creator->id;
    $event->recurrence = 'none';
    $event->save();
    $event->participants()->attach($creator->id);

    return compact('creator', 'viewer', 'zeno', 'atlas', 'event', 'start');
}

function fetchClassifiedEntry(User $viewer, Project $zeno, array $userIds, CarbonImmutable $start)
{
    $query = http_build_query([
        'start' => $start->copy()->subDay()->toIso8601String(),
        'end' => $start->copy()->addDays(2)->toIso8601String(),
        'users' => $userIds,
    ]);

    $response = test()->actingAs($viewer)
        ->withSession(['accounts' => [['user_id' => $viewer->id]], 'account_active_index' => 0])
        ->getJson("/u/0/p/{$zeno->project_slug}/calendar/events?{$query}")
        ->assertOk();

    return collect($response->json())->first(
        fn ($e) => str_contains((string) $e['id'], 'classified-') || ($e['title'] ?? null) === 'Confidential planning session'
    );
}

it('shows full event details when the creator is transparent', function () {
    ['creator' => $creator, 'viewer' => $viewer, 'zeno' => $zeno, 'start' => $start] = seedVisibilityScenario('transparent');

    $entry = fetchClassifiedEntry($viewer, $zeno, [$creator->id], $start);

    expect($entry)->not->toBeNull();
    expect($entry['title'])->toBe('Confidential planning session');
    expect($entry['is_classified'] ?? false)->toBeFalse();
});

it('hides the title but keeps real times when the creator is masked', function () {
    ['creator' => $creator, 'viewer' => $viewer, 'zeno' => $zeno, 'start' => $start] = seedVisibilityScenario('masked');

    $entry = fetchClassifiedEntry($viewer, $zeno, [$creator->id], $start);

    expect($entry)->not->toBeNull();
    expect($entry)->not->toHaveKey('title');
    expect($entry['is_classified'])->toBeTrue();
    expect($entry['visibility'])->toBe('masked');
    expect($entry['start_time'])->toStartWith($start->toIso8601String());
});

it('strips everything but a busy block when the creator is busy_only', function () {
    ['creator' => $creator, 'viewer' => $viewer, 'zeno' => $zeno, 'start' => $start] = seedVisibilityScenario('busy_only');

    $entry = fetchClassifiedEntry($viewer, $zeno, [$creator->id], $start);

    expect($entry)->not->toBeNull();
    expect($entry)->not->toHaveKey('title');
    expect($entry['is_classified'])->toBeTrue();
    expect($entry['visibility'])->toBe('busy_only');
});
