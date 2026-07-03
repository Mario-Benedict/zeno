<?php

namespace App\Http\Requests\Notes;

use Illuminate\Foundation\Http\FormRequest;

class StoreNoteCollaboratorRequest extends FormRequest
{
    public function authorize(): bool
    {
        // NotePolicy::manageCollaborators is checked explicitly in the controller.
        return true;
    }

    public function rules(): array
    {
        return [
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'can_edit' => ['required', 'boolean'],
        ];
    }
}
