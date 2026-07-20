<?php

namespace App\Http\Requests\Kanban;

use App\Models\Project;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\File;
use Illuminate\Validation\Validator;

class StoreKanbanCardRequest extends FormRequest
{
    private const MAX_TOTAL_ATTACHMENT_BYTES = 50 * 1024 * 1024;

    public function authorize(): bool
    {
        // Board/project authorization remains in KanbanCardController.
        return true;
    }

    public function rules(): array
    {
        $projectId = $this->resolveProject($this->route('project'))?->project_id;

        $dueDateRules = ['nullable', 'date'];
        if ($this->filled('kanban_board_card_start_date')) {
            $dueDateRules[] = 'after:kanban_board_card_start_date';
        }

        return [
            'kanban_board_card_id' => ['nullable', 'string', 'uuid'],
            'title' => ['required', 'string', 'max:20'],
            'description' => ['nullable', 'string', 'max:10000'],
            'kanban_board_card_start_date' => ['nullable', 'date'],
            'kanban_board_card_due_date' => $dueDateRules,
            'label_ids' => ['sometimes', 'array'],
            'label_ids.*' => [
                'string',
                'distinct',
                Rule::exists('card_labels', 'card_label_id')
                    ->where('card_label_project_id', $projectId),
            ],
            'member_ids' => ['sometimes', 'array'],
            'member_ids.*' => [
                'integer',
                'distinct',
                Rule::exists('project_user', 'user_id')
                    ->where('project_id', $projectId),
            ],
            'checklist' => ['nullable', 'array'],
            'checklist.id' => ['required_with:checklist', 'string', 'uuid'],
            'checklist.name' => ['required_with:checklist', 'string', 'max:255'],
            'checklist.items' => ['required_with:checklist', 'array', 'min:1', 'max:50'],
            'checklist.items.*.id' => ['required', 'string', 'uuid', 'distinct'],
            'checklist.items.*.name' => ['required', 'string', 'max:255'],
            'attachments' => ['sometimes', 'array', 'max:10'],
            'attachments.*.id' => ['required', 'string', 'uuid', 'distinct'],
            'attachments.*.file' => [
                'required',
                File::types([
                    'jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'txt', 'csv',
                    'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip',
                ])->max(20 * 1024),
            ],
        ];
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

    /**
     * Keep the complete multipart request within a predictable upload budget.
     *
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $attachments = $this->file('attachments', []);
                $totalBytes = collect(is_array($attachments) ? $attachments : [])
                    ->sum(function ($attachment): int {
                        $file = is_array($attachment) ? ($attachment['file'] ?? null) : null;

                        return $file ? (int) $file->getSize() : 0;
                    });

                if ($totalBytes > self::MAX_TOTAL_ATTACHMENT_BYTES) {
                    $validator->errors()->add(
                        'attachments',
                        'The combined attachment size must be 50 MB or smaller.',
                    );
                }
            },
        ];
    }
}
