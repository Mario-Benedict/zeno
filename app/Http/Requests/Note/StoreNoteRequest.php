<?php

namespace App\Http\Requests\Note;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Validates the payload for creating a personal note.
 *
 * Expected JSON body:
 * {
 *   "title":   "Untitled",
 *   "content": { "html": "", "text": "" }
 * }
 */
class StoreNoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Authorization is handled by the auth middleware
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'title'        => ['required', 'string', 'max:255'],
            'content'      => ['nullable', 'array'],
            'content.html' => ['nullable', 'string'],
            'content.text' => ['nullable', 'string'],
        ];
    }
}