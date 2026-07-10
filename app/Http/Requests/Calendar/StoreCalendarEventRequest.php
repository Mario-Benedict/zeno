<?php

namespace App\Http\Requests\Calendar;

use App\Models\Project;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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

        // If assigning someone other than yourself, you must be OWNER or ADMIN
        $assignees = $this->input('participants', []);
        if (
            count($assignees) > 1 ||
            (count($assignees) === 1 && (int) $assignees[0] !== $user->id)
        ) {
            if (! in_array($membership->pivot->role, ['OWNER', 'ADMIN'], true)) {
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
            'recurrence_end_date' => ['nullable', 'date', 'after_or_equal:start_time'],
            'participants' => ['required', 'array', 'min:1'],
            'participants.*' => ['required', 'integer', 'exists:users,id'],
        ];
    }
}
