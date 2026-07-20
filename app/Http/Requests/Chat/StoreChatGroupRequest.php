<?php

namespace App\Http\Requests\Chat;

use App\Models\Project;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * StoreChatGroupRequest
 * ----------------------
 * Validates the payload when a user creates a new group chat room with an
 * explicit subset of project members.
 *
 * Route: POST /projects/{project}/chat/rooms/group
 */
class StoreChatGroupRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $project = $this->route('project');
        $projectId = $project instanceof Project ? $project->project_id : $project;

        return [
            'name' => ['required', 'string', 'max:255'],
            'participant_ids' => ['required', 'array', 'min:1'],
            'participant_ids.*' => [
                'integer',
                Rule::exists('project_user', 'user_id')->where('project_id', $projectId),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Please enter a group name.',
            'participant_ids.required' => 'Please select at least one member.',
            'participant_ids.min' => 'Please select at least one member.',
            'participant_ids.*.exists' => 'One of the selected users is not a member of this project.',
        ];
    }
}
