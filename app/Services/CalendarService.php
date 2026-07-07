<?php

namespace App\Services;

use App\Models\CalendarEvent;
use App\Models\Project;
use App\Models\User;
use Carbon\Carbon;
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
     * How far ahead to expand recurring events (in months).
     */
    private const RECURRENCE_HORIZON_MONTHS = 6;

    /**
     * Get events for a calendar view, including CLASSIFIED busy-blocks
     * from other projects.
     *
     * @param  string  $projectId  The currently viewed project
     * @param  int  $viewerId  The authenticated user
     * @param  array  $userIds  Members whose events to show
     * @param  Carbon  $rangeStart  Query window start (UTC)
     * @param  Carbon  $rangeEnd  Query window end (UTC)
     * @return array  Array of event data (full detail + classified)
     */
    public function getEventsForView(
        string $projectId,
        int $viewerId,
        array $userIds,
        Carbon $rangeStart,
        Carbon $rangeEnd
    ): array {
        if (empty($userIds)) {
            return [];
        }

        // 1) Full-detail events from the current project
        $projectEvents = $this->getProjectEvents($projectId, $userIds, $rangeStart, $rangeEnd);

        // 2) CLASSIFIED busy-blocks from other projects
        $classifiedEvents = $this->getClassifiedEvents($projectId, $viewerId, $userIds, $rangeStart, $rangeEnd);

        return array_merge($projectEvents, $classifiedEvents);
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
        // Get events in range. Weekly recurring events only need to have
        // started before the window ends — expandWeeklyOccurrences() is the
        // single source of truth for which occurrences actually fall inside
        // the requested window, so we don't pre-filter them by overlap here.
        $events = CalendarEvent::where('project_id', $projectId)
            ->where(function ($q) use ($rangeStart, $rangeEnd) {
                $q->where(function ($sub) use ($rangeStart, $rangeEnd) {
                    $sub->where('recurrence', '!=', 'weekly')
                        ->where('start_time', '<', $rangeEnd)
                        ->where('end_time', '>', $rangeStart);
                })->orWhere(function ($sub) use ($rangeEnd) {
                    $sub->where('recurrence', 'weekly')
                        ->where('start_time', '<', $rangeEnd);
                });
            })
            ->whereHas('participants', function ($q) use ($userIds) {
                $q->whereIn('user_id', $userIds);
            })
            ->with(['participants:id,name', 'creator:id,name'])
            ->get();

        $result = [];

        foreach ($events as $event) {
            $eventData = $this->formatFullEvent($event);

            if ($event->recurrence === 'weekly') {
                // Expand recurring events into virtual occurrences
                $occurrences = $this->expandWeeklyOccurrences($event, $rangeStart, $rangeEnd);
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
      array $userIds,
      Carbon $rangeStart,
      Carbon $rangeEnd
  ): array {
      // Get events from OTHER projects where any of the target users participate.
      // Same weekly-recurrence handling as getProjectEvents() — see comment there.
      $events = CalendarEvent::where('project_id', '!=', $projectId)
          ->where(function ($q) use ($rangeStart, $rangeEnd) {
              $q->where(function ($sub) use ($rangeStart, $rangeEnd) {
                  $sub->where('recurrence', '!=', 'weekly')
                      ->where('start_time', '<', $rangeEnd)
                      ->where('end_time', '>', $rangeStart);
              })->orWhere(function ($sub) use ($rangeEnd) {
                  $sub->where('recurrence', 'weekly')
                      ->where('start_time', '<', $rangeEnd);
              });
          })
          ->whereHas('participants', function ($q) use ($userIds) {
              $q->whereIn('user_id', $userIds);
          })
          ->with(['participants:id,name'])
          ->get();

        $result = [];

        foreach ($events as $event) {
            $viewerIsParticipant = $event->participants->contains('id', $viewerId);

            if ($event->recurrence === 'weekly') {
                $occurrences = $viewerIsParticipant
                    ? $this->expandWeeklyOccurrences($event, $rangeStart, $rangeEnd)
                    : $this->expandWeeklyClassifiedOccurrences($event, $rangeStart, $rangeEnd);

                foreach ($occurrences as $occurrence) {
                    $result[] = $occurrence;
                }
            } else {
                if ($viewerIsParticipant) {
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
            'priority' => $event->priority,
            'recurrence' => $event->recurrence,
            'recurrence_group_id' => $event->recurrence_group_id,
            'created_by' => $event->created_by,
            'participants' => $event->participants->map(fn ($u) => [
                'id' => $u->id,
                'name' => $u->name,
            ])->values()->all(),
            'is_classified' => false,
        ];
    }

    /**
     * Format an event as a CLASSIFIED busy-block. Only time and owner info.
     * NO title, description, priority, or project_id.
     */
    private function formatClassifiedEvent(CalendarEvent $event): array
    {
        return [
            'id' => 'classified-' . $event->id,
            'start_time' => $event->start_time->toIso8601String(),
            'end_time' => $event->end_time->toIso8601String(),
            'participants' => $event->participants->map(fn ($u) => [
                'id' => $u->id,
                'name' => $u->name,
            ])->values()->all(),
            'is_classified' => true,
        ];
    }

    /**
     * Expand a weekly recurring event into individual occurrences for the view window.
     * Returns full-detail occurrences.
     */
    private function expandWeeklyOccurrences(
        CalendarEvent $event,
        Carbon $rangeStart,
        Carbon $rangeEnd
    ): array {
        $occurrences = [];
        $duration = $event->start_time->diffInSeconds($event->end_time);
        $excludedDates = collect($event->excluded_occurrence_dates ?? [])
            ->map(fn ($date) => Carbon::parse($date)->toDateString())
            ->all();

        // Calculate the horizon limit
        $horizon = $event->start_time->copy()->addMonths(self::RECURRENCE_HORIZON_MONTHS);
        $effectiveEnd = $rangeEnd->lt($horizon) ? $rangeEnd : $horizon;

        $current = $event->start_time->copy();

        while ($current->lt($effectiveEnd)) {
            $occEnd = $current->copy()->addSeconds($duration);
            $occurrenceDate = $current->toDateString();

            if ($occEnd->gt($rangeStart) && $current->lt($effectiveEnd) && ! in_array($occurrenceDate, $excludedDates, true)) {
                $occ = $this->formatFullEvent($event);
                $occ['id'] = $event->id . '-' . $current->format('Y-m-d');
                $occ['original_event_id'] = $event->id;
                $occ['start_time'] = $current->toIso8601String();
                $occ['end_time'] = $occEnd->toIso8601String();
                $occ['is_recurring_instance'] = true;
                $occurrences[] = $occ;
            }

            // CarbonImmutable is used app-wide (see AppServiceProvider), so
            // add* returns a new instance and must be reassigned.
            $current = $current->addWeek();
        }

        return $occurrences;
    }

    /**
     * Expand a weekly recurring event into CLASSIFIED occurrences.
     */
    private function expandWeeklyClassifiedOccurrences(
        CalendarEvent $event,
        Carbon $rangeStart,
        Carbon $rangeEnd
    ): array {
        $occurrences = [];
        $duration = $event->start_time->diffInSeconds($event->end_time);
        $excludedDates = collect($event->excluded_occurrence_dates ?? [])
            ->map(fn ($date) => Carbon::parse($date)->toDateString())
            ->all();

        $horizon = $event->start_time->copy()->addMonths(self::RECURRENCE_HORIZON_MONTHS);
        $effectiveEnd = $rangeEnd->lt($horizon) ? $rangeEnd : $horizon;

        $current = $event->start_time->copy();

        while ($current->lt($effectiveEnd)) {
            $occEnd = $current->copy()->addSeconds($duration);
            $occurrenceDate = $current->toDateString();

            if ($occEnd->gt($rangeStart) && $current->lt($effectiveEnd) && ! in_array($occurrenceDate, $excludedDates, true)) {
                $occ = $this->formatClassifiedEvent($event);
                $occ['id'] = 'classified-' . $event->id . '-' . $current->format('Y-m-d');
                $occ['start_time'] = $current->toIso8601String();
                $occ['end_time'] = $occEnd->toIso8601String();
                $occurrences[] = $occ;
            }

            // CarbonImmutable is used app-wide (see AppServiceProvider), so
            // add* returns a new instance and must be reassigned.
            $current = $current->addWeek();
        }

        return $occurrences;
    }

    /**
     * Create a calendar event with participants.
     */
    public function createEvent(array $data, array $participantIds): CalendarEvent
    {
        $startTime = Carbon::parse($data['start_time'])->utc();
        $endTime = Carbon::parse($data['end_time'])->utc();

        $event = new CalendarEvent();
        $event->id = Str::uuid()->toString();
        $event->project_id = $data['project_id'];
        $event->title = $data['title'];
        $event->description = $data['description'] ?? null;
        $event->start_time = $startTime;
        $event->end_time = $endTime;
        $event->priority = $data['priority'] ?? 'mid';
        $event->created_by = $data['created_by'];
        $event->recurrence = $data['recurrence'] ?? 'none';

        if ($event->recurrence === 'weekly') {
            $event->recurrence_group_id = Str::uuid()->toString();
        }

        $event->save();
        $event->participants()->sync($participantIds);
        $event->load('participants:id,name');

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

        if ($event->recurrence === 'weekly' && $scope === 'single' && isset($data['occurrence_date'])) {
            $occurrenceDate = Carbon::parse($data['occurrence_date'])->toDateString();

            return DB::transaction(function () use ($event, $data, $participantIds, $occurrenceDate) {
                $this->appendExcludedOccurrenceDate($event, $occurrenceDate);

                $newData = array_merge($data, [
                    'project_id' => $event->project_id,
                    'created_by' => $event->created_by,
                    'recurrence' => 'none',
                ]);

                unset($newData['scope'], $newData['occurrence_date']);

                return $this->createEvent($newData, $participantIds);
            });
        }

        // Update the event directly (applies to 'all' or non-recurring)
        $event->fill(collect($data)->only([
            'title', 'description', 'priority', 'recurrence',
        ])->all());

        if (isset($data['start_time'])) {
            $event->start_time = $startTime;
        }
        if (isset($data['end_time'])) {
            $event->end_time = $endTime;
        }

        $event->save();
        $event->participants()->sync($participantIds);
        $event->load('participants:id,name');

        return $event;
    }

    /**
     * Delete an event. For recurring, handles "this only" vs "all".
     *
     * @param  string  $scope  'single' or 'all'
     */
    public function deleteEvent(CalendarEvent $event, string $scope = 'single', ?string $occurrenceDate = null): void
    {
        if ($event->recurrence === 'weekly' && $scope === 'single' && $occurrenceDate) {
            $this->appendExcludedOccurrenceDate($event, Carbon::parse($occurrenceDate)->toDateString());

            return;
        }

        if ($event->recurrence === 'weekly' && $scope === 'all' && $event->recurrence_group_id) {
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
