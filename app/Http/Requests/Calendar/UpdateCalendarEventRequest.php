<?php

namespace App\Http\Requests\Calendar;

use App\Enums\ProjectRole;
use App\Models\CalendarEvent;
use App\Models\Project;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateCalendarEventRequest extends FormRequest
{
    private ?Project $project = null;

    private ?CalendarEvent $event = null;

    public function authorize(): bool
    {
        $project = $this->resolveProject($this->route('project'));
        if (! $project instanceof Project) {
            return false;
        }
        $this->project = $project;

        $event = $this->resolveEvent($this->route('event'));
        abort_if(
            ! $event instanceof CalendarEvent || $event->project_id !== $project->project_id,
            404
        );
        $this->event = $event;

        $user = $this->user();
        if (! $user) {
            return false;
        }

        $membership = $user->projects()
            ->where('projects.project_id', $project->project_id)
            ->first();

        if (! $membership) {
            return false;
        }

        $role = ProjectRole::tryFrom((string) $membership->pivot->role);
        if (in_array($role, [ProjectRole::Owner, ProjectRole::Admin], true)) {
            return true;
        }

        if ($role !== ProjectRole::Member) {
            return false;
        }

        $canMutateEvent = (int) $event->created_by === $user->id
            || $event->participants()->where('users.id', $user->id)->exists();

        if (! $canMutateEvent) {
            return false;
        }

        $assignees = $this->input('participants');
        if (is_array($assignees)) {
            $existingAssignees = $event->participants()
                ->pluck('users.id')
                ->map(fn ($id) => (int) $id)
                ->sort()
                ->values()
                ->all();
            $submittedAssignees = collect($assignees)
                ->map(fn ($id) => (int) $id)
                ->unique()
                ->sort()
                ->values()
                ->all();

            if ($submittedAssignees !== $existingAssignees) {
                return false;
            }
        }

        return true;
    }

    private function resolveProject(Project|string|null $project): ?Project
    {
        if ($project instanceof Project) {
            return $project;
        }

        if (! is_string($project) || $project === '') {
            return null;
        }

        return Project::where('project_slug', $project)->first();
    }

    private function resolveEvent(CalendarEvent|string|null $event): ?CalendarEvent
    {
        if ($event instanceof CalendarEvent) {
            return $event;
        }

        if (! is_string($event) || $event === '') {
            return null;
        }

        return CalendarEvent::whereKey($event)->first();
    }

    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'start_time' => ['sometimes', 'date'],
            'end_time' => ['sometimes', 'date'],
            'label_ids' => ['sometimes', 'array'],
            'label_ids.*' => [
                'string',
                'uuid',
                Rule::exists('card_labels', 'card_label_id')
                    ->where('card_label_project_id', $this->project?->project_id),
            ],
            'recurrence' => ['sometimes', 'in:none,daily,weekly,monthly,yearly'],
            'recurrence_end_date' => ['nullable', 'date'],
            'participants' => ['sometimes', 'array', 'min:1'],
            'participants.*' => [
                'integer',
                'distinct',
                Rule::exists('project_user', 'user_id')
                    ->where('project_id', $this->project?->project_id),
            ],
            'scope' => ['sometimes', 'in:single,all'],
            'occurrence_date' => ['sometimes', 'date'],
        ];
    }

    /**
     * Validate partial updates against persisted range values. Recurrence end
     * dates are compared as whole calendar days, so the event's start day is
     * valid even when start_time itself is later than midnight.
     *
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [function (Validator $validator): void {
            if (
                ! $this->event instanceof CalendarEvent
                || ! $this->project instanceof Project
                || $this->event->project_id !== $this->project->project_id
            ) {
                return;
            }

            if (! $validator->errors()->hasAny(['start_time', 'end_time'])) {
                $startTime = CarbonImmutable::parse($this->input('start_time', $this->event->start_time));
                $endTime = CarbonImmutable::parse($this->input('end_time', $this->event->end_time));

                if (! $endTime->isAfter($startTime)) {
                    $validator->errors()->add(
                        'end_time',
                        __('validation.after', [
                            'attribute' => 'end time',
                            'date' => 'start time',
                        ])
                    );
                }
            }

            if ($validator->errors()->hasAny(['start_time', 'recurrence_end_date'])) {
                return;
            }

            $recurrenceEndDate = array_key_exists('recurrence_end_date', $this->all())
                ? $this->input('recurrence_end_date')
                : $this->event->recurrence_end_date;

            if ($recurrenceEndDate === null || $recurrenceEndDate === '') {
                return;
            }

            $startDate = CarbonImmutable::parse(
                $this->input('start_time', $this->event->start_time)
            )->startOfDay();
            $recurrenceEndCalendarDate = CarbonImmutable::parse($recurrenceEndDate)->startOfDay();

            if ($recurrenceEndCalendarDate->lt($startDate)) {
                $validator->errors()->add(
                    'recurrence_end_date',
                    __('validation.after_or_equal', [
                        'attribute' => 'recurrence end date',
                        'date' => 'start date',
                    ])
                );
            }
        }];
    }
}
