<?php

namespace App\Http\Requests\Notes;

use Illuminate\Foundation\Http\FormRequest;

class StoreNoteCollaboratorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // actual permission check is done in the controller (must be note owner)
    }

    public function rules(): array
    {
        return [
            'user_id' => ['required', 'integer', 'exists:users,id'],
            'can_edit' => ['required', 'boolean'],
        ];
    }
}