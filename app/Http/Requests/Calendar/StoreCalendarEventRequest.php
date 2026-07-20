<?php

namespace App\Http\Requests\Calendar;

use App\Enums\ProjectRole;
use App\Models\Project;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreCalendarEventRequest extends FormRequest
{
    private ?Project $project = null;

    public function authorize(): bool
    {
        $project = $this->resolveProject($this->route('project'));
        if (! $project instanceof Project) {
            return false;
        }
        $this->project = $project;

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
        if ($role === null || $role === ProjectRole::Viewer) {
            return false;
        }

        // If assigning someone other than yourself, you must be OWNER or ADMIN
        $assignees = $this->input('participants', []);
        if (
            is_array($assignees)
            && (count($assignees) > 1
                || (count($assignees) === 1 && (int) $assignees[0] !== $user->id))
        ) {
            if (! in_array($role, [ProjectRole::Owner, ProjectRole::Admin], true)) {
                return false; // MEMBERS can only assign themselves
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

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'start_time' => ['required', 'date'],
            'end_time' => ['required', 'date', 'after:start_time'],
            'label_ids' => ['sometimes', 'array'],
            'label_ids.*' => [
                'string',
                'uuid',
                Rule::exists('card_labels', 'card_label_id')
                    ->where('card_label_project_id', $this->project?->project_id),
            ],
            'recurrence' => ['required', 'in:none,daily,weekly,monthly,yearly'],
            'recurrence_end_date' => ['nullable', 'date'],
            'participants' => ['required', 'array', 'min:1'],
            'participants.*' => [
                'required',
                'integer',
                'distinct',
                Rule::exists('project_user', 'user_id')
                    ->where('project_id', $this->project?->project_id),
            ],
        ];
    }

    /**
     * A recurrence boundary is a calendar day, not a timestamp. Comparing it
     * with Laravel's `after_or_equal:start_time` would treat the chosen day as
     * midnight and incorrectly reject a boundary on the event's start day.
     *
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [function (Validator $validator): void {
            if (
                $validator->errors()->hasAny(['start_time', 'recurrence_end_date'])
                || ! $this->filled('recurrence_end_date')
            ) {
                return;
            }

            $startDate = CarbonImmutable::parse($this->input('start_time'))->startOfDay();
            $recurrenceEndDate = CarbonImmutable::parse($this->input('recurrence_end_date'))->startOfDay();

            if ($recurrenceEndDate->lt($startDate)) {
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
