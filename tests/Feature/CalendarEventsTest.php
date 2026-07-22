<?php

use App\Enums\ProjectRole;
use App\Models\CalendarEvent;
use App\Models\CardLabel;
use App\Models\KanbanBoard;
use App\Models\KanbanBoardCard;
use App\Models\Project;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;

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

    $urgentLabel = CardLabel::create([
        'card_label_project_id' => $atlas->project_id,
        'card_label_name' => 'Urgent',
        'card_label_color_hex' => '#D32F2F',
    ]);

    $start = CarbonImmutable::now('UTC')->addDay()->setTime(9, 0);
    $secret = new CalendarEvent;
    $secret->project_id = $atlas->project_id;
    $secret->title = 'Review Kontrak Klien X';
    $secret->description = 'Top secret negotiation';
    $secret->start_time = $start;
    $secret->end_time = $start->addHours(2);
    $secret->created_by = $mario->id;
    $secret->recurrence = 'none';
    $secret->save();
    $secret->participants()->attach($mario->id);
    $secret->labels()->attach($urgentLabel->card_label_id);

    return compact('mario', 'kevin', 'zeno', 'atlas', 'secret', 'start', 'urgentLabel');
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
    expect($classified)->not->toHaveKeys(['title', 'description', 'labels', 'project_id']);
});

it('shows full detail — including its real project labels — to the participant on any project they belong to', function () {
    ['mario' => $mario, 'zeno' => $zeno, 'start' => $start, 'urgentLabel' => $urgentLabel] = seedCalendarScenario();

    $response = $this->actingAs($mario)
        ->withSession(['accounts' => [['user_id' => $mario->id]], 'account_active_index' => 0])
        ->getJson(eventsUrl($zeno->project_slug, $start, [$mario->id]))
        ->assertOk();

    $own = collect($response->json())->firstWhere('title', 'Review Kontrak Klien X');

    expect($own)->not->toBeNull();
    expect($own['is_classified'])->toBeFalse();
    expect($own['labels'])->toHaveCount(1);
    expect($own['labels'][0]['card_label_id'])->toBe($urgentLabel->card_label_id);
    expect($own['labels'][0]['card_label_name'])->toBe('Urgent');
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

it('stops expanding a recurring event past its "ends on" date', function () {
    ['mario' => $mario, 'zeno' => $zeno] = seedCalendarScenario();

    $anchor = CarbonImmutable::now('UTC')->next(CarbonImmutable::MONDAY)->setTime(10, 0);
    // Only the anchor week and the following one should ever be generated.
    $recurrenceEnd = $anchor->copy()->addWeek()->addDays(2);

    $this->actingAs($mario)
        ->withSession(['accounts' => [['user_id' => $mario->id]], 'account_active_index' => 0])
        ->postJson("/u/0/p/{$zeno->project_slug}/calendar/events", [
            'title' => 'Bounded Weekly Sync',
            'start_time' => $anchor->toIso8601String(),
            'end_time' => $anchor->addHour()->toIso8601String(),
            'recurrence' => 'weekly',
            'recurrence_end_date' => $recurrenceEnd->toDateString(),
            'participants' => [$mario->id],
        ])
        ->assertCreated();

    // Query a window far wider than the "ends on" date — occurrences must
    // stop at recurrence_end_date regardless of how far the view range goes.
    $query = http_build_query([
        'start' => $anchor->copy()->subDay()->toIso8601String(),
        'end' => $anchor->copy()->addWeeks(6)->toIso8601String(),
        'users' => [$mario->id],
    ]);

    $response = $this->actingAs($mario)
        ->withSession(['accounts' => [['user_id' => $mario->id]], 'account_active_index' => 0])
        ->getJson("/u/0/p/{$zeno->project_slug}/calendar/events?{$query}")
        ->assertOk();

    $occurrences = collect($response->json())->where('title', 'Bounded Weekly Sync');

    expect($occurrences->count())->toBe(2);
    expect($occurrences->pluck('recurrence_end_date')->unique()->all())
        ->toBe([$recurrenceEnd->toDateString()]);
});

it('accepts a same-day recurrence boundary on create and rejects a prior day', function () {
    ['mario' => $mario, 'zeno' => $zeno] = seedCalendarScenario();
    $start = CarbonImmutable::create(2026, 7, 20, 10, 0, 0, 'UTC');
    $session = ['accounts' => [['user_id' => $mario->id]], 'account_active_index' => 0];
    $url = "/u/0/p/{$zeno->project_slug}/calendar/events";

    $this->actingAs($mario)
        ->withSession($session)
        ->postJson($url, [
            'title' => 'Same-day recurrence boundary',
            'start_time' => $start->toIso8601String(),
            'end_time' => $start->addHour()->toIso8601String(),
            'recurrence' => 'daily',
            'recurrence_end_date' => '2026-07-20',
            'participants' => [$mario->id],
        ])
        ->assertCreated();

    $this->actingAs($mario)
        ->withSession($session)
        ->postJson($url, [
            'title' => 'Prior-day recurrence boundary',
            'start_time' => $start->toIso8601String(),
            'end_time' => $start->addHour()->toIso8601String(),
            'recurrence' => 'daily',
            'recurrence_end_date' => '2026-07-19',
            'participants' => [$mario->id],
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('recurrence_end_date');
});

it('accepts a same-day recurrence boundary on update and rejects a prior day', function () {
    ['mario' => $mario, 'zeno' => $zeno] = seedCalendarScenario();
    $start = CarbonImmutable::create(2026, 7, 20, 10, 0, 0, 'UTC');

    $event = new CalendarEvent;
    $event->project_id = $zeno->project_id;
    $event->title = 'Recurring planning';
    $event->start_time = $start;
    $event->end_time = $start->addHour();
    $event->created_by = $mario->id;
    $event->recurrence = 'daily';
    $event->recurrence_group_id = (string) Str::uuid();
    $event->recurrence_end_date = '2026-07-22';
    $event->save();
    $event->participants()->attach($mario->id);

    $session = ['accounts' => [['user_id' => $mario->id]], 'account_active_index' => 0];
    $url = "/u/0/p/{$zeno->project_slug}/calendar/events/{$event->id}";

    $this->actingAs($mario)
        ->withSession($session)
        ->patchJson($url, ['recurrence_end_date' => '2026-07-20'])
        ->assertOk();

    expect($event->fresh()->recurrence_end_date->toDateString())->toBe('2026-07-20');

    $this->actingAs($mario)
        ->withSession($session)
        ->patchJson($url, ['recurrence_end_date' => '2026-07-19'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('recurrence_end_date');

    expect($event->fresh()->recurrence_end_date->toDateString())->toBe('2026-07-20');
});

it('rejects a partial start update beyond the persisted recurrence boundary', function () {
    ['mario' => $mario, 'zeno' => $zeno] = seedCalendarScenario();
    $start = CarbonImmutable::create(2026, 7, 20, 10, 0, 0, 'UTC');

    $event = new CalendarEvent;
    $event->project_id = $zeno->project_id;
    $event->title = 'Long recurring event';
    $event->start_time = $start;
    $event->end_time = $start->addDays(5);
    $event->created_by = $mario->id;
    $event->recurrence = 'daily';
    $event->recurrence_group_id = (string) Str::uuid();
    $event->recurrence_end_date = '2026-07-22';
    $event->save();
    $event->participants()->attach($mario->id);

    $this->actingAs($mario)
        ->withSession(['accounts' => [['user_id' => $mario->id]], 'account_active_index' => 0])
        ->patchJson("/u/0/p/{$zeno->project_slug}/calendar/events/{$event->id}", [
            'start_time' => $start->addDays(3)->toIso8601String(),
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('recurrence_end_date');

    expect($event->fresh()->start_time->toIso8601String())->toBe($start->toIso8601String());
});

it('expands a daily recurring event into multiple occurrences', function () {
    ['mario' => $mario, 'zeno' => $zeno] = seedCalendarScenario();

    $anchor = CarbonImmutable::now('UTC')->addDay()->setTime(8, 0);

    $this->actingAs($mario)
        ->withSession(['accounts' => [['user_id' => $mario->id]], 'account_active_index' => 0])
        ->postJson("/u/0/p/{$zeno->project_slug}/calendar/events", [
            'title' => 'Daily Standup',
            'start_time' => $anchor->toIso8601String(),
            'end_time' => $anchor->addMinutes(15)->toIso8601String(),
            'recurrence' => 'daily',
            'participants' => [$mario->id],
        ])
        ->assertCreated();

    $query = http_build_query([
        'start' => $anchor->copy()->subDay()->toIso8601String(),
        'end' => $anchor->copy()->addDays(5)->toIso8601String(),
        'users' => [$mario->id],
    ]);

    $response = $this->actingAs($mario)
        ->withSession(['accounts' => [['user_id' => $mario->id]], 'account_active_index' => 0])
        ->getJson("/u/0/p/{$zeno->project_slug}/calendar/events?{$query}")
        ->assertOk();

    $occurrences = collect($response->json())->where('title', 'Daily Standup');

    expect($occurrences->count())->toBeGreaterThanOrEqual(5);
});

it('expands a monthly recurring event without overflowing short months', function () {
    ['mario' => $mario, 'zeno' => $zeno] = seedCalendarScenario();

    // Anchor on the 31st of a long month — the next occurrence must clamp to
    // the end of February (2027 isn't a leap year) rather than spilling into
    // March, the exact edge case `addMonthNoOverflow()` exists to handle.
    $anchor = CarbonImmutable::create(2027, 1, 31, 9, 0, 0, 'UTC');

    $this->actingAs($mario)
        ->withSession(['accounts' => [['user_id' => $mario->id]], 'account_active_index' => 0])
        ->postJson("/u/0/p/{$zeno->project_slug}/calendar/events", [
            'title' => 'Monthly Report',
            'start_time' => $anchor->toIso8601String(),
            'end_time' => $anchor->addHour()->toIso8601String(),
            'recurrence' => 'monthly',
            'participants' => [$mario->id],
        ])
        ->assertCreated();

    $query = http_build_query([
        'start' => $anchor->copy()->subDay()->toIso8601String(),
        'end' => $anchor->copy()->addMonths(2)->toIso8601String(),
        'users' => [$mario->id],
    ]);

    $response = $this->actingAs($mario)
        ->withSession(['accounts' => [['user_id' => $mario->id]], 'account_active_index' => 0])
        ->getJson("/u/0/p/{$zeno->project_slug}/calendar/events?{$query}")
        ->assertOk();

    $occurrences = collect($response->json())->where('title', 'Monthly Report')->values();

    expect($occurrences->count())->toBeGreaterThanOrEqual(2);

    $februaryOccurrence = $occurrences->first(fn ($occ) => str_starts_with($occ['start_time'], '2027-02'));

    expect($februaryOccurrence)->not->toBeNull();
    expect($februaryOccurrence['start_time'])->toStartWith('2027-02-28');
});

it('shows an assigned Kanban card with a due date as a read-only calendar entry', function () {
    ['mario' => $mario, 'zeno' => $zeno] = seedCalendarScenario();

    $board = KanbanBoard::create([
        'kanban_board_project_id' => $zeno->project_id,
        'kanban_board_name' => 'To Do',
        'kanban_board_position' => 0,
    ]);

    $dueDate = CarbonImmutable::now('UTC')->addDays(2)->setTime(15, 0);

    $card = KanbanBoardCard::create([
        'kanban_board_id' => $board->kanban_board_id,
        'position' => 0,
        'kanban_board_card_title' => 'Ship the release notes',
        'is_completed' => false,
        'kanban_board_card_due_date' => $dueDate,
    ]);
    $card->members()->attach($mario->id);

    // An unassigned card with the same due date must NOT show up — there's
    // no "assignment to someone" to represent.
    $unassignedCard = KanbanBoardCard::create([
        'kanban_board_id' => $board->kanban_board_id,
        'position' => 1,
        'kanban_board_card_title' => 'No assignee here',
        'is_completed' => false,
        'kanban_board_card_due_date' => $dueDate,
    ]);

    $query = http_build_query([
        'start' => $dueDate->copy()->subDay()->toIso8601String(),
        'end' => $dueDate->copy()->addDay()->toIso8601String(),
        'users' => [$mario->id],
    ]);

    $response = $this->actingAs($mario)
        ->withSession(['accounts' => [['user_id' => $mario->id]], 'account_active_index' => 0])
        ->getJson("/u/0/p/{$zeno->project_slug}/calendar/events?{$query}")
        ->assertOk();

    $entries = collect($response->json());
    $task = $entries->firstWhere('kanban_board_card_id', $card->kanban_board_card_id);

    expect($task)->not->toBeNull();
    expect($task['is_kanban_task'])->toBeTrue();
    expect($task['title'])->toBe('Ship the release notes');
    expect($task['participants'][0]['id'])->toBe($mario->id);
    expect($task['kanban_board_name'])->toBe('To Do');

    expect(
        $entries->firstWhere('kanban_board_card_id', $unassignedCard->kanban_board_card_id)
    )->toBeNull();
});

it('hides an assigned Kanban card from the calendar when its assignee is unchecked', function () {
    ['mario' => $mario, 'kevin' => $kevin, 'zeno' => $zeno] = seedCalendarScenario();

    $board = KanbanBoard::create([
        'kanban_board_project_id' => $zeno->project_id,
        'kanban_board_name' => 'To Do',
        'kanban_board_position' => 0,
    ]);

    $dueDate = CarbonImmutable::now('UTC')->addDays(2)->setTime(15, 0);

    $card = KanbanBoardCard::create([
        'kanban_board_id' => $board->kanban_board_id,
        'position' => 0,
        'kanban_board_card_title' => 'Mario-only task',
        'is_completed' => false,
        'kanban_board_card_due_date' => $dueDate,
    ]);
    $card->members()->attach($mario->id);

    // Mario is unchecked in the sidebar — only Kevin is passed as `users`.
    $query = http_build_query([
        'start' => $dueDate->copy()->subDay()->toIso8601String(),
        'end' => $dueDate->copy()->addDay()->toIso8601String(),
        'users' => [$kevin->id],
    ]);

    $response = $this->actingAs($kevin)
        ->withSession(['accounts' => [['user_id' => $kevin->id]], 'account_active_index' => 0])
        ->getJson("/u/0/p/{$zeno->project_slug}/calendar/events?{$query}")
        ->assertOk();

    expect(
        collect($response->json())->firstWhere('kanban_board_card_id', $card->kanban_board_card_id)
    )->toBeNull();
});

it('forbids a non-member from reading a project calendar', function () {
    ['zeno' => $zeno, 'start' => $start] = seedCalendarScenario();
    $outsider = User::factory()->create();

    $this->actingAs($outsider)
        ->withSession(['accounts' => [['user_id' => $outsider->id]], 'account_active_index' => 0])
        ->getJson(eventsUrl($zeno->project_slug, $start, [$outsider->id]))
        ->assertForbidden();
});

it('rejects calendar user filters for people outside the current project', function () {
    ['kevin' => $kevin, 'zeno' => $zeno, 'atlas' => $atlas, 'start' => $start] = seedCalendarScenario();
    $outsider = User::factory()->create();
    $atlas->members()->attach($outsider->id, ['role' => 'MEMBER', 'color' => '#7B7B7B']);

    $outsideEvent = new CalendarEvent;
    $outsideEvent->project_id = $atlas->project_id;
    $outsideEvent->title = 'Outsider schedule';
    $outsideEvent->start_time = $start;
    $outsideEvent->end_time = $start->addHour();
    $outsideEvent->created_by = $outsider->id;
    $outsideEvent->recurrence = 'none';
    $outsideEvent->save();
    $outsideEvent->participants()->attach($outsider->id);

    $this->actingAs($kevin)
        ->withSession(['accounts' => [['user_id' => $kevin->id]], 'account_active_index' => 0])
        ->getJson(eventsUrl($zeno->project_slug, $start, [$outsider->id]))
        ->assertUnprocessable()
        ->assertJsonValidationErrors('users.0');
});

it('rejects event participants outside the current project on create and update', function () {
    ['mario' => $mario, 'zeno' => $zeno, 'start' => $start] = seedCalendarScenario();
    $outsider = User::factory()->create();

    $this->actingAs($mario)
        ->withSession(['accounts' => [['user_id' => $mario->id]], 'account_active_index' => 0])
        ->postJson("/u/0/p/{$zeno->project_slug}/calendar/events", [
            'title' => 'Invalid participant',
            'start_time' => $start->toIso8601String(),
            'end_time' => $start->addHour()->toIso8601String(),
            'recurrence' => 'none',
            'participants' => [$outsider->id],
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('participants.0');

    $event = new CalendarEvent;
    $event->project_id = $zeno->project_id;
    $event->title = 'Valid event';
    $event->start_time = $start;
    $event->end_time = $start->addHour();
    $event->created_by = $mario->id;
    $event->recurrence = 'none';
    $event->save();
    $event->participants()->attach($mario->id);

    $this->actingAs($mario)
        ->withSession(['accounts' => [['user_id' => $mario->id]], 'account_active_index' => 0])
        ->patchJson("/u/0/p/{$zeno->project_slug}/calendar/events/{$event->id}", [
            'participants' => [$outsider->id],
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('participants.0');

    expect($event->fresh()->participants()->pluck('users.id')->all())->toBe([$mario->id]);
});

it('returns validation errors for non-array event participants', function () {
    ['mario' => $mario, 'zeno' => $zeno, 'start' => $start] = seedCalendarScenario();

    $this->actingAs($mario)
        ->withSession(['accounts' => [['user_id' => $mario->id]], 'account_active_index' => 0])
        ->postJson("/u/0/p/{$zeno->project_slug}/calendar/events", [
            'title' => 'Invalid participant payload',
            'start_time' => $start->toIso8601String(),
            'end_time' => $start->addHour()->toIso8601String(),
            'recurrence' => 'none',
            'participants' => $mario->id,
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('participants');

    $event = new CalendarEvent;
    $event->project_id = $zeno->project_id;
    $event->title = 'Valid event';
    $event->start_time = $start;
    $event->end_time = $start->addHour();
    $event->created_by = $mario->id;
    $event->recurrence = 'none';
    $event->save();
    $event->participants()->attach($mario->id);

    $this->actingAs($mario)
        ->withSession(['accounts' => [['user_id' => $mario->id]], 'account_active_index' => 0])
        ->patchJson("/u/0/p/{$zeno->project_slug}/calendar/events/{$event->id}", [
            'participants' => $mario->id,
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('participants');
});

it('keeps viewers read only across calendar event mutations and recurring scopes', function () {
    ['zeno' => $zeno, 'start' => $start] = seedCalendarScenario();
    $viewer = User::factory()->create();
    $zeno->members()->attach($viewer->id, [
        'role' => ProjectRole::Viewer->value,
        'color' => '#7B7B7B',
    ]);

    $session = ['accounts' => [['user_id' => $viewer->id]], 'account_active_index' => 0];
    $baseUrl = "/u/0/p/{$zeno->project_slug}/calendar/events";

    $this->actingAs($viewer)
        ->withSession($session)
        ->postJson($baseUrl, [
            'title' => 'Viewer event',
            'start_time' => $start->toIso8601String(),
            'end_time' => $start->addHour()->toIso8601String(),
            'recurrence' => 'none',
            'participants' => [$viewer->id],
        ])
        ->assertForbidden();

    $event = new CalendarEvent;
    $event->project_id = $zeno->project_id;
    $event->title = 'Viewer-owned recurring event';
    $event->start_time = $start;
    $event->end_time = $start->addHour();
    $event->created_by = $viewer->id;
    $event->recurrence = 'weekly';
    $event->recurrence_group_id = (string) Str::uuid();
    $event->save();
    $event->participants()->attach($viewer->id);

    foreach (['single', 'all'] as $scope) {
        $this->actingAs($viewer)
            ->withSession($session)
            ->patchJson("{$baseUrl}/{$event->id}", [
                'title' => "Viewer edit {$scope}",
                'scope' => $scope,
                'occurrence_date' => $start->toIso8601String(),
            ])
            ->assertForbidden();

        $this->actingAs($viewer)
            ->withSession($session)
            ->deleteJson("{$baseUrl}/{$event->id}", [
                'scope' => $scope,
                'occurrence_date' => $start->toIso8601String(),
            ])
            ->assertForbidden();
    }

    expect($event->fresh()->title)->toBe('Viewer-owned recurring event');
});

it('forbids members from mutating unrelated events across recurring scopes', function () {
    ['mario' => $mario, 'kevin' => $kevin, 'zeno' => $zeno, 'start' => $start] = seedCalendarScenario();
    $session = ['accounts' => [['user_id' => $kevin->id]], 'account_active_index' => 0];
    $baseUrl = "/u/0/p/{$zeno->project_slug}/calendar/events";

    $event = new CalendarEvent;
    $event->project_id = $zeno->project_id;
    $event->title = 'Mario recurring event';
    $event->start_time = $start;
    $event->end_time = $start->addHour();
    $event->created_by = $mario->id;
    $event->recurrence = 'weekly';
    $event->recurrence_group_id = (string) Str::uuid();
    $event->save();
    $event->participants()->attach($mario->id);

    foreach (['single', 'all'] as $scope) {
        $this->actingAs($kevin)
            ->withSession($session)
            ->patchJson("{$baseUrl}/{$event->id}", [
                'title' => "Unauthorized {$scope} edit",
                'scope' => $scope,
                'occurrence_date' => $start->toIso8601String(),
            ])
            ->assertForbidden();

        $this->actingAs($kevin)
            ->withSession($session)
            ->deleteJson("{$baseUrl}/{$event->id}", [
                'scope' => $scope,
                'occurrence_date' => $start->toIso8601String(),
            ])
            ->assertForbidden();
    }

    expect($event->fresh()->title)->toBe('Mario recurring event');
});

it('lets a member participant edit a multi-participant event without reassigning it', function () {
    ['mario' => $mario, 'kevin' => $kevin, 'zeno' => $zeno, 'start' => $start] = seedCalendarScenario();

    $event = new CalendarEvent;
    $event->project_id = $zeno->project_id;
    $event->title = 'Team planning';
    $event->start_time = $start;
    $event->end_time = $start->addHour();
    $event->created_by = $mario->id;
    $event->recurrence = 'none';
    $event->save();
    $event->participants()->attach([$mario->id, $kevin->id]);

    $session = ['accounts' => [['user_id' => $kevin->id]], 'account_active_index' => 0];
    $url = "/u/0/p/{$zeno->project_slug}/calendar/events/{$event->id}";

    $this->actingAs($kevin)
        ->withSession($session)
        ->patchJson($url, [
            'title' => 'Team planning updated',
            'participants' => [$kevin->id, $mario->id],
        ])
        ->assertOk();

    expect($event->fresh()->title)->toBe('Team planning updated');
    expect($event->participants()->pluck('users.id')->sort()->values()->all())
        ->toBe(collect([$mario->id, $kevin->id])->sort()->values()->all());

    $this->actingAs($kevin)
        ->withSession($session)
        ->patchJson($url, [
            'participants' => [$kevin->id],
        ])
        ->assertForbidden();

    $this->actingAs($kevin)
        ->withSession($session)
        ->deleteJson($url)
        ->assertOk();

    expect(CalendarEvent::find($event->id))->toBeNull();
});

it('lets a member creator mutate an event they no longer participate in', function () {
    ['mario' => $mario, 'kevin' => $kevin, 'zeno' => $zeno, 'start' => $start] = seedCalendarScenario();

    $event = new CalendarEvent;
    $event->project_id = $zeno->project_id;
    $event->title = 'Creator-owned event';
    $event->start_time = $start;
    $event->end_time = $start->addHour();
    $event->created_by = $kevin->id;
    $event->recurrence = 'none';
    $event->save();
    $event->participants()->attach($mario->id);

    $session = ['accounts' => [['user_id' => $kevin->id]], 'account_active_index' => 0];
    $url = "/u/0/p/{$zeno->project_slug}/calendar/events/{$event->id}";

    $this->actingAs($kevin)
        ->withSession($session)
        ->patchJson($url, [
            'title' => 'Creator update',
            'participants' => [$mario->id],
        ])
        ->assertOk();

    $this->actingAs($kevin)
        ->withSession($session)
        ->deleteJson($url)
        ->assertOk();

    expect(CalendarEvent::find($event->id))->toBeNull();
});

it('refuses to update another project\'s event even via a URL for a project the actor owns', function () {
    // Mario owns both Zeno and Atlas, and is a participant on the Atlas
    // "secret" event — plenty of authorization to touch *something*, but
    // never this event through Zeno's URL. `{event}` route-model binding
    // alone can't catch this: it only proves the UUID exists, not that it
    // belongs to the project in the URL.
    ['mario' => $mario, 'zeno' => $zeno, 'secret' => $secret] = seedCalendarScenario();

    $this->actingAs($mario)
        ->withSession(['accounts' => [['user_id' => $mario->id]], 'account_active_index' => 0])
        ->patchJson("/u/0/p/{$zeno->project_slug}/calendar/events/{$secret->id}", [
            'title' => 'Hijacked via wrong project URL',
        ])
        ->assertNotFound();

    expect($secret->fresh()->title)->toBe('Review Kontrak Klien X');
});

it('refuses to delete another project\'s event even via a URL for a project the actor owns', function () {
    ['mario' => $mario, 'zeno' => $zeno, 'secret' => $secret] = seedCalendarScenario();

    $this->actingAs($mario)
        ->withSession(['accounts' => [['user_id' => $mario->id]], 'account_active_index' => 0])
        ->deleteJson("/u/0/p/{$zeno->project_slug}/calendar/events/{$secret->id}")
        ->assertNotFound();

    expect(CalendarEvent::find($secret->id))->not->toBeNull();
});

it('filters every calendar entry by current or other project within the requested range', function () {
    ['mario' => $mario, 'zeno' => $zeno, 'atlas' => $atlas, 'start' => $start] = seedCalendarScenario();

    $own = new CalendarEvent;
    $own->project_id = $zeno->project_id;
    $own->title = 'Zeno planning';
    $own->start_time = $start->addMinutes(30);
    $own->end_time = $start->addMinutes(90);
    $own->created_by = $mario->id;
    $own->recurrence = 'none';
    $own->save();
    $own->participants()->attach($mario->id);

    $outsideRange = new CalendarEvent;
    $outsideRange->project_id = $zeno->project_id;
    $outsideRange->title = 'Next month';
    $outsideRange->start_time = $start->addMonth();
    $outsideRange->end_time = $start->addMonth()->addHour();
    $outsideRange->created_by = $mario->id;
    $outsideRange->recurrence = 'none';
    $outsideRange->save();
    $outsideRange->participants()->attach($mario->id);

    $baseQuery = [
        'start' => $start->subDay()->toIso8601String(),
        'end' => $start->addDays(2)->toIso8601String(),
        'users' => [$mario->id],
    ];

    $ownResponse = $this->actingAs($mario)
        ->withSession(['accounts' => [['user_id' => $mario->id]], 'account_active_index' => 0])
        ->getJson("/u/0/p/{$zeno->project_slug}/calendar/events?".http_build_query([
            ...$baseQuery,
            'source' => 'own',
        ]))
        ->assertOk();

    expect(collect($ownResponse->json())->pluck('project_id')->unique()->all())
        ->toBe([$zeno->project_id]);
    expect(collect($ownResponse->json())->pluck('title')->all())
        ->toContain('Zeno planning')
        ->not->toContain('Next month', 'Review Kontrak Klien X');

    $otherResponse = $this->actingAs($mario)
        ->withSession(['accounts' => [['user_id' => $mario->id]], 'account_active_index' => 0])
        ->getJson("/u/0/p/{$zeno->project_slug}/calendar/events?".http_build_query([
            ...$baseQuery,
            'source' => 'other',
        ]))
        ->assertOk();

    expect(collect($otherResponse->json())->pluck('project_id')->unique()->all())
        ->toBe([$atlas->project_id]);
    expect(collect($otherResponse->json())->pluck('title')->all())
        ->toContain('Review Kontrak Klien X')
        ->not->toContain('Zeno planning', 'Next month');
});

it('rejects an invalid calendar view range', function () {
    ['mario' => $mario, 'zeno' => $zeno, 'start' => $start] = seedCalendarScenario();

    $query = http_build_query([
        'start' => $start->toIso8601String(),
        'end' => $start->subDay()->toIso8601String(),
        'users' => [$mario->id],
    ]);

    $this->actingAs($mario)
        ->withSession(['accounts' => [['user_id' => $mario->id]], 'account_active_index' => 0])
        ->getJson("/u/0/p/{$zeno->project_slug}/calendar/events?{$query}")
        ->assertUnprocessable()
        ->assertJsonValidationErrors('end');
});

it('requires an event end time to be strictly after its start time', function () {
    ['mario' => $mario, 'zeno' => $zeno, 'start' => $start] = seedCalendarScenario();

    $this->actingAs($mario)
        ->withSession(['accounts' => [['user_id' => $mario->id]], 'account_active_index' => 0])
        ->postJson("/u/0/p/{$zeno->project_slug}/calendar/events", [
            'title' => 'Zero duration event',
            'start_time' => $start->toIso8601String(),
            'end_time' => $start->toIso8601String(),
            'recurrence' => 'none',
            'participants' => [$mario->id],
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('end_time');
});

it('validates partial event time updates against the persisted endpoint', function () {
    ['mario' => $mario, 'zeno' => $zeno, 'secret' => $secret, 'start' => $start] = seedCalendarScenario();

    $this->actingAs($mario)
        ->withSession(['accounts' => [['user_id' => $mario->id]], 'account_active_index' => 0])
        ->patchJson("/u/0/p/{$zeno->project_slug}/calendar/events/{$secret->id}", [
            'start_time' => $start->addHours(3)->toIso8601String(),
        ])
        ->assertNotFound();

    $own = new CalendarEvent;
    $own->project_id = $zeno->project_id;
    $own->title = 'Planning';
    $own->start_time = $start;
    $own->end_time = $start->addHours(2);
    $own->created_by = $mario->id;
    $own->recurrence = 'none';
    $own->save();
    $own->participants()->attach($mario->id);

    $this->actingAs($mario)
        ->withSession(['accounts' => [['user_id' => $mario->id]], 'account_active_index' => 0])
        ->patchJson("/u/0/p/{$zeno->project_slug}/calendar/events/{$own->id}", [
            'start_time' => $start->addHours(3)->toIso8601String(),
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('end_time');

    $this->actingAs($mario)
        ->withSession(['accounts' => [['user_id' => $mario->id]], 'account_active_index' => 0])
        ->patchJson("/u/0/p/{$zeno->project_slug}/calendar/events/{$own->id}", [
            'end_time' => $start->subMinute()->toIso8601String(),
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('end_time');
});

it('hydrates a validated calendar date deep link', function () {
    ['mario' => $mario, 'zeno' => $zeno] = seedCalendarScenario();

    $this->actingAs($mario)
        ->withSession(['accounts' => [['user_id' => $mario->id]], 'account_active_index' => 0])
        ->get("/u/0/p/{$zeno->project_slug}/calendar?date=2026-07-20")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('calendar')
            ->where('initialDate', '2026-07-20')
            ->where('activeEventId', null));
});

it('only hydrates a calendar event deep link from the current project', function () {
    ['mario' => $mario, 'zeno' => $zeno, 'secret' => $secret, 'start' => $start] = seedCalendarScenario();

    $ownEvent = new CalendarEvent;
    $ownEvent->project_id = $zeno->project_id;
    $ownEvent->title = 'Zeno deep link';
    $ownEvent->start_time = $start;
    $ownEvent->end_time = $start->addHour();
    $ownEvent->created_by = $mario->id;
    $ownEvent->recurrence = 'none';
    $ownEvent->save();
    $ownEvent->participants()->attach($mario->id);

    $date = $start->toDateString();
    $session = ['accounts' => [['user_id' => $mario->id]], 'account_active_index' => 0];

    $this->actingAs($mario)
        ->withSession($session)
        ->get("/u/0/p/{$zeno->project_slug}/calendar?date={$date}&event={$ownEvent->id}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('calendar')
            ->where('initialDate', $date)
            ->where('activeEventId', $ownEvent->id));

    $this->actingAs($mario)
        ->withSession($session)
        ->get("/u/0/p/{$zeno->project_slug}/calendar?date={$date}&event={$secret->id}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('calendar')
            ->where('initialDate', $date)
            ->where('activeEventId', null));
});

it('rejects a malformed calendar event deep link', function () {
    ['mario' => $mario, 'zeno' => $zeno] = seedCalendarScenario();

    $this->actingAs($mario)
        ->withSession(['accounts' => [['user_id' => $mario->id]], 'account_active_index' => 0])
        ->getJson("/u/0/p/{$zeno->project_slug}/calendar?date=2026-07-20&event=not-a-uuid")
        ->assertUnprocessable()
        ->assertJsonValidationErrors('event');
});
