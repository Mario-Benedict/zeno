<?php

namespace App\Services;

use App\Models\CalendarEvent;
use App\Models\CardLabel;
use App\Models\KanbanBoardCard;
use App\Models\Project;
use App\Models\User;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CalendarService
{
    /**
     * The member palette from the Zeno design system.
     * These are the *light* accent variants from tailwind.config.js
     * (theme.extend.colors.accent.*.light) so each member reads as a soft
     * pastel both in the sidebar dot and as an event-card background.
     * Must stay in sync with the seeding migration and tailwind.config.js.
     */
    public const ACCENT_COLORS = [
        '#FFB3B3', // red
        '#FFD1A1', // orange
        '#FFF0B3', // yellow
        '#DCEDC8', // lime
        '#B2DFDB', // green
        '#B3E5FC', // cyan
        '#C5CAE9', // blue
        '#E1BEE7', // purple
        '#F8BBD0', // pink
        '#D7CCC8', // brown
    ];

    /**
     * How far ahead to expand recurring events (in months). This is a safety
     * cap, not the usual bound — the actual expansion loop below always stops
     * at the requested view's date range first (a month/week grid only ever
     * asks for a few weeks), so a generous cap here only matters for
     * `yearly` events, which need several years ahead to show upcoming
     * occurrences at all.
     */
    private const RECURRENCE_HORIZON_MONTHS = 60;

    /** Every recurrence type except `none` repeats — this is the shared test everywhere below. */
    private function isRecurring(CalendarEvent $event): bool
    {
        return $event->recurrence !== 'none';
    }

    /**
     * Advance a date by one occurrence of the given recurrence type.
     * `addMonthNoOverflow` keeps a "monthly on the 31st" event pinned to the
     * end of shorter months instead of spilling into the next one.
     */
    private function stepRecurrence(CarbonInterface $date, string $recurrence): CarbonInterface
    {
        return match ($recurrence) {
            'daily' => $date->addDay(),
            'weekly' => $date->addWeek(),
            'monthly' => $date->addMonthNoOverflow(),
            'yearly' => $date->addYear(),
            default => $date->addWeek(),
        };
    }

    /**
     * The latest point a recurring event's occurrences should be expanded to
     * — whichever comes first of the requested view's range end, the safety
     * horizon, or the event's own "repeat until" date (`recurrence_end_date`,
     * Google Calendar's "Ends on" — null means no end date).
     */
    private function effectiveExpansionEnd(CalendarEvent $event, Carbon $rangeEnd): CarbonInterface
    {
        $horizon = $event->start_time->copy()->addMonths(self::RECURRENCE_HORIZON_MONTHS);
        $effectiveEnd = $rangeEnd->lt($horizon) ? $rangeEnd : $horizon;

        if ($event->recurrence_end_date) {
            // recurrence_end_date is a calendar day — include the whole day.
            $recurrenceEnd = $event->recurrence_end_date->copy()->endOfDay();
            $effectiveEnd = $effectiveEnd->lt($recurrenceEnd) ? $effectiveEnd : $recurrenceEnd;
        }

        return $effectiveEnd;
    }

    /**
     * Get events for a calendar view, including CLASSIFIED busy-blocks
     * from other projects.
     *
     * @param  string  $projectId  The currently viewed project
     * @param  int  $viewerId  The authenticated user
     * @param  array  $userIds  Members whose events to show
     * @param  Carbon  $rangeStart  Query window start (UTC)
     * @param  Carbon  $rangeEnd  Query window end (UTC)
     * @param  string  $sourceFilter  `all`, `own`, or `other`
     * @return array Array of event data (full detail + classified)
     */
    public function getEventsForView(
        string $projectId,
        int $viewerId,
        array $userIds,
        Carbon $rangeStart,
        Carbon $rangeEnd,
        string $sourceFilter = 'all'
    ): array {
        if (empty($userIds)) {
            return [];
        }

        $projectEvents = [];
        $classifiedEvents = [];
        $kanbanTasks = [];
        $classifiedKanbanTasks = [];

        if ($sourceFilter !== 'other') {
            $projectEvents = $this->getProjectEvents($projectId, $userIds, $rangeStart, $rangeEnd);
            $kanbanTasks = $this->getAssignedKanbanTasks($projectId, $userIds, $rangeStart, $rangeEnd);
        }

        if ($sourceFilter !== 'own') {
            $viewerProjectIds = DB::table('project_user')->where('user_id', $viewerId)->pluck('project_id')->all();
            $classifiedEvents = $this->getClassifiedEvents($projectId, $viewerId, $viewerProjectIds, $userIds, $rangeStart, $rangeEnd);
            $classifiedKanbanTasks = $this->getClassifiedKanbanTasks($projectId, $viewerId, $viewerProjectIds, $userIds, $rangeStart, $rangeEnd);
        }

        return array_merge($projectEvents, $classifiedEvents, $kanbanTasks, $classifiedKanbanTasks);
    }

    /**
     * Kanban cards in this project that (a) have a due date set and (b) are
     * assigned to at least one of the selected members — i.e. cards with a
     * real "assignment to someone" per the feature request. Only the due
     * date is projected onto the calendar (not the start date): a card's
     * start date describes when work on it begins, not a commitment the
     * assignee owes anyone else, so it has no business appearing as a
     * calendar block. Formatted to the same shape `formatFullEvent()`
     * produces, plus `is_kanban_task` / `kanban_board_card_id` /
     * `kanban_board_id`, so every existing render path (month/week grid, the
     * mini-calendar's "has event" dots, the detail modal) already knows how
     * to display them without special-casing.
     */
    private function getAssignedKanbanTasks(
        string $projectId,
        array $userIds,
        Carbon $rangeStart,
        Carbon $rangeEnd
    ): array {
        $cards = KanbanBoardCard::whereHas(
            'kanbanBoard',
            fn ($q) => $q->where('kanban_board_project_id', $projectId)
        )
            ->whereNotNull('kanban_board_card_due_date')
            ->where('kanban_board_card_due_date', '<', $rangeEnd)
            ->where('kanban_board_card_due_date', '>=', $rangeStart)
            ->whereHas('members', fn ($q) => $q->whereIn('users.id', $userIds))
            ->with([
                // Load every assignee, not just the ones matching the calendar's
                // member filter — the filter above only decides whether the card
                // shows up at all; the card's full assignee list must match what
                // Kanban shows, or the two look out of sync.
                'members',
                'labels',
                'kanbanBoard:kanban_board_id,kanban_board_name',
            ])
            ->get();

        return $cards->map(fn (KanbanBoardCard $card) => $this->formatKanbanTask($card, $projectId))->values()->all();
    }

    /**
     * Format a Kanban card as a calendar entry. Structurally a full
     * `CalendarEventFull` (recurrence is always `none` — Kanban cards don't
     * recur) plus the extra fields the frontend uses to render it read-only
     * and link back to the board instead of Calendar's own edit form. Always
     * anchored on the due date only — see `getAssignedKanbanTasks()`.
     */
    private function formatKanbanTask(KanbanBoardCard $card, string $projectId): array
    {
        $start = $card->kanban_board_card_due_date;
        $end = $start->copy()->addHour();

        return [
            'id' => 'kanban-'.$card->kanban_board_card_id,
            'project_id' => $projectId,
            'title' => $card->kanban_board_card_title,
            'description' => $card->kanban_board_card_description,
            'start_time' => $start->toIso8601String(),
            'end_time' => $end->toIso8601String(),
            'labels' => $card->labels->map(fn (CardLabel $label) => [
                'card_label_id' => $label->card_label_id,
                'card_label_name' => $label->card_label_name,
                'card_label_color_hex' => $label->card_label_color_hex,
            ])->values()->all(),
            'recurrence' => 'none',
            'recurrence_group_id' => null,
            'recurrence_end_date' => null,
            'created_by' => $card->members->first()?->id,
            'participants' => $card->members->map(fn (User $u) => [
                'id' => $u->id,
                'name' => $u->name,
            ])->values()->all(),
            'is_classified' => false,
            'is_completed' => $card->is_completed,
            'is_kanban_task' => true,
            'kanban_board_card_id' => $card->kanban_board_card_id,
            'kanban_board_id' => $card->kanban_board_id,
            'kanban_board_name' => $card->kanbanBoard->kanban_board_name,
        ];
    }

    /**
     * Fetch full-detail events from a specific project for given users.
     */
    private function getProjectEvents(
        string $projectId,
        array $userIds,
        Carbon $rangeStart,
        Carbon $rangeEnd
    ): array {
        // Get events in range. Recurring events only need to have started
        // before the window ends — expandRecurringOccurrences() is the
        // single source of truth for which occurrences actually fall inside
        // the requested window, so we don't pre-filter them by overlap here.
        $events = CalendarEvent::where('project_id', $projectId)
            ->where(function ($q) use ($rangeStart, $rangeEnd) {
                $q->where(function ($sub) use ($rangeStart, $rangeEnd) {
                    $sub->where('recurrence', 'none')
                        ->where('start_time', '<', $rangeEnd)
                        ->where('end_time', '>', $rangeStart);
                })->orWhere(function ($sub) use ($rangeEnd) {
                    $sub->where('recurrence', '!=', 'none')
                        ->where('start_time', '<', $rangeEnd);
                });
            })
            ->whereHas('participants', function ($q) use ($userIds) {
                $q->whereIn('user_id', $userIds);
            })
            ->with(['participants:id,name', 'creator:id,name', 'labels'])
            ->get();

        $result = [];

        foreach ($events as $event) {
            $eventData = $this->formatFullEvent($event);

            if ($this->isRecurring($event)) {
                // Expand recurring events into virtual occurrences
                $occurrences = $this->expandRecurringOccurrences($event, $rangeStart, $rangeEnd);
                foreach ($occurrences as $occurrence) {
                    $result[] = $occurrence;
                }
            } else {
                $result[] = $eventData;
            }
        }

        return $result;
    }

    /**
     * Fetch CLASSIFIED busy-blocks from all projects EXCEPT the current one.
     * For events where the viewer is a participant, return full details instead.
     */
    private function getClassifiedEvents(
        string $projectId,
        int $viewerId,
        array $viewerProjectIds,
        array $userIds,
        Carbon $rangeStart,
        Carbon $rangeEnd
    ): array {
        // Get events from OTHER projects where any of the target users participate.
        // Same recurrence handling as getProjectEvents() — see comment there.
        $events = CalendarEvent::where('project_id', '!=', $projectId)
            ->where(function ($q) use ($rangeStart, $rangeEnd) {
                $q->where(function ($sub) use ($rangeStart, $rangeEnd) {
                    $sub->where('recurrence', 'none')
                        ->where('start_time', '<', $rangeEnd)
                        ->where('end_time', '>', $rangeStart);
                })->orWhere(function ($sub) use ($rangeEnd) {
                    $sub->where('recurrence', '!=', 'none')
                        ->where('start_time', '<', $rangeEnd);
                });
            })
            ->whereHas('participants', function ($q) use ($userIds) {
                $q->whereIn('user_id', $userIds);
            })
            // `labels` is only actually read by formatFullEvent() below, for
            // the subset of events the viewer participates in — eager-loading
            // it here avoids a per-event lazy load in that branch. `creator`
            // is needed by formatClassifiedEvent() to decide how much detail
            // a non-participant viewer is allowed to see (their `calendar_visibility`).
            ->with(['participants:id,name', 'labels', 'creator:id,calendar_visibility'])
            ->get();

        $result = [];

        foreach ($events as $event) {
            // Full detail when the viewer is a participant, when the event's
            // creator has opted into "transparent" cross-project visibility,
            // or when the viewer already shares membership in the event's
            // own project — classifying it would just hide data the viewer
            // has legitimate access to anyway via that other project.
            // Otherwise the event is classified — either "masked" (generic
            // label, real times) or "busy_only" (no label at all), per the
            // creator's `calendar_visibility` preference.
            $showFull = $event->participants->contains('id', $viewerId)
                || $event->creator?->calendar_visibility === 'transparent'
                || in_array($event->project_id, $viewerProjectIds, true);

            if ($this->isRecurring($event)) {
                $occurrences = $showFull
                    ? $this->expandRecurringOccurrences($event, $rangeStart, $rangeEnd)
                    : $this->expandRecurringClassifiedOccurrences($event, $rangeStart, $rangeEnd);

                foreach ($occurrences as $occurrence) {
                    $result[] = $occurrence;
                }
            } else {
                if ($showFull) {
                    $result[] = $this->formatFullEvent($event);
                } else {
                    $result[] = $this->formatClassifiedEvent($event);
                }
            }
        }

        return $result;
    }

    /**
     * Format an event with full details.
     */
    private function formatFullEvent(CalendarEvent $event): array
    {
        return [
            'id' => $event->id,
            'project_id' => $event->project_id,
            'title' => $event->title,
            'description' => $event->description,
            'start_time' => $event->start_time->toIso8601String(),
            'end_time' => $event->end_time->toIso8601String(),
            'labels' => $event->labels->map(fn (CardLabel $label) => [
                'card_label_id' => $label->card_label_id,
                'card_label_name' => $label->card_label_name,
                'card_label_color_hex' => $label->card_label_color_hex,
            ])->values()->all(),
            'recurrence' => $event->recurrence,
            'recurrence_group_id' => $event->recurrence_group_id,
            'recurrence_end_date' => $event->recurrence_end_date?->toDateString(),
            'created_by' => $event->created_by,
            'participants' => $event->participants->map(fn ($u) => [
                'id' => $u->id,
                'name' => $u->name,
            ])->values()->all(),
            'is_classified' => false,
        ];
    }

    /**
     * Format an event as a CLASSIFIED busy-block. Only time and owner info —
     * NO title, description, priority, or project_id. `visibility` tells the
     * frontend whether to render a generic "busy" label (`masked`) or
     * nothing but the coloured block itself (`busy_only`); the actual label
     * text is a translated string owned by the frontend, not baked in here.
     */
    private function formatClassifiedEvent(CalendarEvent $event): array
    {
        return [
            'id' => 'classified-'.$event->id,
            'start_time' => $event->start_time->toIso8601String(),
            'end_time' => $event->end_time->toIso8601String(),
            'participants' => $event->participants->map(fn ($u) => [
                'id' => $u->id,
                'name' => $u->name,
            ])->values()->all(),
            'is_classified' => true,
            'visibility' => $event->creator?->calendar_visibility === 'masked' ? 'masked' : 'busy_only',
        ];
    }

    /**
     * Fetch CLASSIFIED Kanban-task busy-blocks from all projects EXCEPT the
     * current one — the Kanban-sourced counterpart to getClassifiedEvents().
     * A card has no single "creator" the way a CalendarEvent does, so
     * visibility is decided from the relevant assignees (the ones among
     * `$userIds`): full detail if the viewer is themselves an assignee, or
     * if any relevant assignee opted into "transparent"; otherwise
     * classified, using "masked" if any relevant assignee chose that over
     * "busy_only".
     */
    private function getClassifiedKanbanTasks(
        string $projectId,
        int $viewerId,
        array $viewerProjectIds,
        array $userIds,
        Carbon $rangeStart,
        Carbon $rangeEnd
    ): array {
        $cards = KanbanBoardCard::whereHas(
            'kanbanBoard',
            fn ($q) => $q->where('kanban_board_project_id', '!=', $projectId)
        )
            ->whereNotNull('kanban_board_card_due_date')
            ->where('kanban_board_card_due_date', '<', $rangeEnd)
            ->where('kanban_board_card_due_date', '>=', $rangeStart)
            ->whereHas('members', fn ($q) => $q->whereIn('users.id', $userIds))
            ->with([
                'members:id,name,calendar_visibility',
                'labels',
                'kanbanBoard:kanban_board_id,kanban_board_name,kanban_board_project_id',
            ])
            ->get();

        return $cards->map(function (KanbanBoardCard $card) use ($viewerId, $viewerProjectIds, $userIds) {
            $relevantAssignees = $card->members->whereIn('id', $userIds);

            // Full detail when the viewer is themselves an assignee, when a
            // relevant assignee opted into "transparent" visibility, or when
            // the viewer already shares membership in the card's own
            // project — classifying it would just hide data the viewer has
            // legitimate access to anyway via that other project.
            $showFull = $card->members->contains('id', $viewerId)
                || $relevantAssignees->contains(fn (User $u) => $u->calendar_visibility === 'transparent')
                || in_array($card->kanbanBoard->kanban_board_project_id, $viewerProjectIds, true);

            return $showFull
                ? $this->formatKanbanTask($card, $card->kanbanBoard->kanban_board_project_id)
                : $this->formatClassifiedKanbanTask($card, $relevantAssignees);
        })->values()->all();
    }

    /**
     * Format a Kanban card as a CLASSIFIED busy-block — the Kanban-sourced
     * counterpart to formatClassifiedEvent(): only time and participants, no
     * title, description, or board/project info.
     */
    private function formatClassifiedKanbanTask(KanbanBoardCard $card, Collection $relevantAssignees): array
    {
        $start = $card->kanban_board_card_due_date;
        $end = $start->copy()->addHour();

        return [
            'id' => 'classified-kanban-'.$card->kanban_board_card_id,
            'start_time' => $start->toIso8601String(),
            'end_time' => $end->toIso8601String(),
            'participants' => $card->members->map(fn (User $u) => [
                'id' => $u->id,
                'name' => $u->name,
            ])->values()->all(),
            'is_classified' => true,
            'is_kanban_task' => true,
            'visibility' => $relevantAssignees->contains(fn (User $u) => $u->calendar_visibility === 'masked')
                ? 'masked'
                : 'busy_only',
        ];
    }

    /**
     * Expand a recurring event into individual occurrences for the view
     * window (daily/weekly/monthly/yearly step, per `$event->recurrence`).
     * Returns full-detail occurrences.
     */
    private function expandRecurringOccurrences(
        CalendarEvent $event,
        Carbon $rangeStart,
        Carbon $rangeEnd
    ): array {
        $occurrences = [];
        $duration = $event->start_time->diffInSeconds($event->end_time);
        $excludedDates = collect($event->excluded_occurrence_dates ?? [])
            ->map(fn ($date) => Carbon::parse($date)->toDateString())
            ->all();

        $effectiveEnd = $this->effectiveExpansionEnd($event, $rangeEnd);

        $current = $event->start_time->copy();

        while ($current->lt($effectiveEnd)) {
            $occEnd = $current->copy()->addSeconds($duration);
            $occurrenceDate = $current->toDateString();

            if ($occEnd->gt($rangeStart) && $current->lt($effectiveEnd) && ! in_array($occurrenceDate, $excludedDates, true)) {
                $occ = $this->formatFullEvent($event);
                $occ['id'] = $event->id.'-'.$current->format('Y-m-d');
                $occ['original_event_id'] = $event->id;
                $occ['start_time'] = $current->toIso8601String();
                $occ['end_time'] = $occEnd->toIso8601String();
                $occ['is_recurring_instance'] = true;
                $occurrences[] = $occ;
            }

            // CarbonImmutable is used app-wide (see AppServiceProvider), so
            // step* returns a new instance and must be reassigned.
            $current = $this->stepRecurrence($current, $event->recurrence);
        }

        return $occurrences;
    }

    /**
     * Expand a recurring event into CLASSIFIED occurrences.
     */
    private function expandRecurringClassifiedOccurrences(
        CalendarEvent $event,
        Carbon $rangeStart,
        Carbon $rangeEnd
    ): array {
        $occurrences = [];
        $duration = $event->start_time->diffInSeconds($event->end_time);
        $excludedDates = collect($event->excluded_occurrence_dates ?? [])
            ->map(fn ($date) => Carbon::parse($date)->toDateString())
            ->all();

        $effectiveEnd = $this->effectiveExpansionEnd($event, $rangeEnd);

        $current = $event->start_time->copy();

        while ($current->lt($effectiveEnd)) {
            $occEnd = $current->copy()->addSeconds($duration);
            $occurrenceDate = $current->toDateString();

            if ($occEnd->gt($rangeStart) && $current->lt($effectiveEnd) && ! in_array($occurrenceDate, $excludedDates, true)) {
                $occ = $this->formatClassifiedEvent($event);
                $occ['id'] = 'classified-'.$event->id.'-'.$current->format('Y-m-d');
                $occ['start_time'] = $current->toIso8601String();
                $occ['end_time'] = $occEnd->toIso8601String();
                $occurrences[] = $occ;
            }

            // CarbonImmutable is used app-wide (see AppServiceProvider), so
            // step* returns a new instance and must be reassigned.
            $current = $this->stepRecurrence($current, $event->recurrence);
        }

        return $occurrences;
    }

    /**
     * Create a calendar event with participants.
     *
     * @param  array  $data  May include `label_ids`, an array of existing
     *                       project CardLabel UUIDs to attach.
     */
    public function createEvent(array $data, array $participantIds): CalendarEvent
    {
        $startTime = Carbon::parse($data['start_time'])->utc();
        $endTime = Carbon::parse($data['end_time'])->utc();

        $event = new CalendarEvent;
        $event->id = Str::uuid()->toString();
        $event->project_id = $data['project_id'];
        $event->title = $data['title'];
        $event->description = $data['description'] ?? null;
        $event->start_time = $startTime;
        $event->end_time = $endTime;
        $event->created_by = $data['created_by'];
        $event->recurrence = $data['recurrence'] ?? 'none';

        if ($this->isRecurring($event)) {
            $event->recurrence_group_id = Str::uuid()->toString();
            $event->recurrence_end_date = $data['recurrence_end_date'] ?? null;
        }

        $event->save();
        $event->participants()->sync($participantIds);
        $event->labels()->sync($data['label_ids'] ?? []);
        $event->load(['participants:id,name', 'labels']);

        return $event;
    }

    /**
     * Update a calendar event. Handles "this only" vs "all" for recurring events.
     *
     * @param  string  $scope  'single' or 'all'
     */
    public function updateEvent(CalendarEvent $event, array $data, array $participantIds, string $scope = 'single'): CalendarEvent
    {
        $startTime = isset($data['start_time']) ? Carbon::parse($data['start_time'])->utc() : $event->start_time;
        $endTime = isset($data['end_time']) ? Carbon::parse($data['end_time'])->utc() : $event->end_time;

        if ($this->isRecurring($event) && $scope === 'single' && isset($data['occurrence_date'])) {
            $occurrenceDate = Carbon::parse($data['occurrence_date'])->toDateString();

            return DB::transaction(function () use ($event, $data, $participantIds, $occurrenceDate) {
                $this->appendExcludedOccurrenceDate($event, $occurrenceDate);

                $newData = array_merge($data, [
                    'project_id' => $event->project_id,
                    'created_by' => $event->created_by,
                    'recurrence' => 'none',
                    // Carry the original occurrence's labels forward unless
                    // this particular edit explicitly changed them.
                    'label_ids' => $data['label_ids'] ?? $event->labels->pluck('card_label_id')->all(),
                ]);

                unset($newData['scope'], $newData['occurrence_date']);

                return $this->createEvent($newData, $participantIds);
            });
        }

        // Update the event directly (applies to 'all' or non-recurring)
        $event->fill(collect($data)->only([
            'title', 'description', 'recurrence', 'recurrence_end_date',
        ])->all());

        if (array_key_exists('label_ids', $data)) {
            $event->labels()->sync($data['label_ids']);
        }

        if (isset($data['start_time'])) {
            $event->start_time = $startTime;
        }
        if (isset($data['end_time'])) {
            $event->end_time = $endTime;
        }

        $event->save();
        $event->participants()->sync($participantIds);
        $event->load(['participants:id,name', 'labels']);

        return $event;
    }

    /**
     * Delete an event. For recurring, handles "this only" vs "all".
     *
     * @param  string  $scope  'single' or 'all'
     */
    public function deleteEvent(CalendarEvent $event, string $scope = 'single', ?string $occurrenceDate = null): void
    {
        if ($this->isRecurring($event) && $scope === 'single' && $occurrenceDate) {
            $this->appendExcludedOccurrenceDate($event, Carbon::parse($occurrenceDate)->toDateString());

            return;
        }

        if ($this->isRecurring($event) && $scope === 'all' && $event->recurrence_group_id) {
            // Delete all events in the recurrence group
            CalendarEvent::where('recurrence_group_id', $event->recurrence_group_id)->delete();
        } else {
            $event->delete();
        }
    }

    private function appendExcludedOccurrenceDate(CalendarEvent $event, string $occurrenceDate): void
    {
        $excludedDates = collect($event->excluded_occurrence_dates ?? [])
            ->map(fn ($date) => Carbon::parse($date)->toDateString())
            ->all();

        if (! in_array($occurrenceDate, $excludedDates, true)) {
            $excludedDates[] = $occurrenceDate;
            $event->excluded_occurrence_dates = array_values($excludedDates);
            $event->save();
        }
    }

    /**
     * Assign a unique color from the accent palette to a new project member.
     */
    public static function assignMemberColor(string $projectId): string
    {
        $usedColors = DB::table('project_user')
            ->where('project_id', $projectId)
            ->whereNotNull('color')
            ->pluck('color')
            ->all();

        $available = array_diff(self::ACCENT_COLORS, $usedColors);

        if (empty($available)) {
            // All colors taken — cycle through the palette with a random pick
            $available = self::ACCENT_COLORS;
        }

        $available = array_values($available);

        return $available[array_rand($available)];
    }
}
