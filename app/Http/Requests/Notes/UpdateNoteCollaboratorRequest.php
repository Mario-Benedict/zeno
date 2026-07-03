<?php

namespace App\Http\Requests\Notes;

use Illuminate\Foundation\Http\FormRequest;

class UpdateNoteCollaboratorRequest extends FormRequest
{
    public function authorize(): bool
    {
        // NotePolicy::manageCollaborators is checked explicitly in the controller.
        return true;
    }

    public function rules(): array
    {
        return [
            'can_edit' => ['required', 'boolean'],
        ];
    }
}
