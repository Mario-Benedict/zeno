<?php

namespace App\Http\Requests\Chat;

use Illuminate\Foundation\Http\FormRequest;

/**
 * SendMessageRequest
 * -------------------
 * Validates the payload for sending a new chat message.
 *
 * Route: POST /projects/{project}/chat/rooms/{room}/messages
 *
 * Supports:
 *  - Text-only messages
 *  - Image messages (single or bulk)
 *  - File messages (single or bulk)
 *  - Mixed: text caption + attachments
 */
class SendMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Authorization (membership check) is handled by ChatRoomPolicy in the controller.
        return true;
    }

    public function rules(): array
    {
        return [
            /**
             * Primary type of the message.
             * Determines how the frontend renders the bubble.
             */
            'type' => ['required', 'in:text,image,file'],

            /**
             * Text content.
             * Required for type=text; optional caption for image/file.
             * Max 5000 characters to prevent abuse.
             */
            'body' => [
                'required_if:type,text',
                'nullable',
                'string',
                'max:5000',
            ],

            /**
             * Uploaded attachments array (supports bulk-send).
             * Required when type is image or file; forbidden for text.
             */
            'attachments'             => ['required_unless:type,text', 'nullable', 'array', 'max:10'],
            'attachments.*.file'      => ['required', 'file', 'max:51200'], // 50 MB per file
            'attachments.*.type'      => ['required', 'in:image,file'],
        ];
    }

    public function messages(): array
    {
        return [
            'body.required_if'            => 'A message body is required for text messages.',
            'attachments.required_unless'  => 'At least one attachment is required for image or file messages.',
            'attachments.*.file.max'       => 'Each attachment must be 50 MB or smaller.',
        ];
    }
}