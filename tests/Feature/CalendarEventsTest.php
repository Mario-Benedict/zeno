<?php

use App\Models\CalendarEvent;
use App\Models\CardLabel;
use App\Models\KanbanBoard;
use App\Models\KanbanBoardCard;
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
