<?php

namespace App\Http\Requests\Chat;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

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
    private const MAX_TOTAL_ATTACHMENT_BYTES = 50 * 1024 * 1024;

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
            'attachments' => ['required_unless:type,text', 'nullable', 'array', 'max:10'],
            'attachments.*.file' => ['required', 'file', 'max:51200'], // 50 MB per file
            'attachments.*.type' => ['required', 'in:image,file'],
        ];
    }

    public function messages(): array
    {
        return [
            'body.required_if' => 'A message body is required for text messages.',
            'attachments.required_unless' => 'At least one attachment is required for image or file messages.',
            'attachments.*.file.max' => 'Each attachment must be 50 MB or smaller.',
        ];
    }

    /**
     * Keep the entire multipart request below the PHP upload boundary while
     * preserving support for multiple attachments.
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
