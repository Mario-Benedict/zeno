<?php

namespace App\Http\Requests\Calendar;

use App\Models\Project;
use Illuminate\Foundation\Http\FormRequest;

class UpdateCalendarEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        $project = $this->resolveProject($this->route('project'));
        if (! $project instanceof Project) {
            return false;
        }

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

        $assignees = $this->input('participants');
        if ($assignees !== null) {
            if (
                count($assignees) > 1 ||
                (count($assignees) === 1 && (int) $assignees[0] !== $user->id)
            ) {
                if (! in_array($membership->pivot->role, ['OWNER', 'ADMIN'], true)) {
                    return false;
                }
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
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'start_time' => ['sometimes', 'date'],
            'end_time' => ['sometimes', 'date', 'after:start_time'],
            'priority' => ['sometimes', 'in:low,mid,high'],
            'recurrence' => ['sometimes', 'in:none,weekly'],
            'participants' => ['sometimes', 'array', 'min:1'],
            'participants.*' => ['integer', 'exists:users,id'],
            'scope' => ['sometimes', 'in:single,all'],
            'occurrence_date' => ['sometimes', 'date'],
        ];
    }
}
