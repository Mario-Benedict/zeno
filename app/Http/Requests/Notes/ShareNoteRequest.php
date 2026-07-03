<?php

namespace App\Http\Requests\Notes;

use Illuminate\Foundation\Http\FormRequest;

class ShareNoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        // NotePolicy::share is checked explicitly in the controller.
        return true;
    }

    public function rules(): array
    {
        return [
            'collaborators' => ['sometimes', 'array'],
            'collaborators.*.user_id' => ['required_with:collaborators', 'integer', 'exists:users,id'],
            'collaborators.*.can_edit' => ['required_with:collaborators', 'boolean'],
        ];
    }
}
