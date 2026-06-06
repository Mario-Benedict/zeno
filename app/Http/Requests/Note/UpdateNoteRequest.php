<?php

namespace App\Http\Requests\Note;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Validates the payload for updating a personal note.
 *
 * Expected JSON body:
 * {
 *   "title":   "My Note Title",
 *   "content": { "html": "<p>...</p>", "text": "..." }
 * }
 */
class UpdateNoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Authorization handled by ownership check in controller
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'title'           => ['sometimes', 'required', 'string', 'max:255'],
            'content'         => ['sometimes', 'nullable', 'array'],
            'content.html'    => ['nullable', 'string'],
            'content.text'    => ['nullable', 'string'],
            'content.embedUrl'   => ['nullable', 'url', 'max:500'],
            'content.embedTitle' => ['nullable', 'string', 'max:255'],
        ];
    }
}