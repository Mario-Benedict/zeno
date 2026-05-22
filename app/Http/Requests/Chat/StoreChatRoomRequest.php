<?php

namespace App\Http\Requests\Chat;

use Illuminate\Foundation\Http\FormRequest;

/**
 * StoreChatRoomRequest
 * ---------------------
 * Validates the payload when a user manually creates a DM room.
 * Group rooms are auto-created by ChatRoomService and don't need this request.
 *
 * Route: POST /projects/{project}/chat/rooms
 */
class StoreChatRoomRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [

            'recipient_id' => ['required', 'uuid', 'exists:users,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'recipient_id.required' => 'Please select a user to message.',
            'recipient_id.exists'   => 'The selected user does not exist.',
        ];
    }
}