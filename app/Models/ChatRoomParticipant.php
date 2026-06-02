<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

/**
 * ChatRoomParticipant
 * --------------------
 * Explicit pivot model for the chat_room_participants table.
 * Using a dedicated pivot model lets us attach observers, accessors,
 * and helper methods without polluting ChatRoom or User.
 *
 * @property int         $id
 * @property string      $chat_room_id
 * @property string      $user_id
 * @property 'member'|'admin' $role
 * @property bool        $is_muted
 * @property string|null $last_read_message_id
 * @property \Carbon\Carbon $joined_at
 */
class ChatRoomParticipant extends Pivot
{
    protected $table = 'chat_room_participants';

    public $incrementing = true;

    public $timestamps = false;

    protected $casts = [
        'is_muted'  => 'boolean',
        'joined_at' => 'datetime',
    ];

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }
}