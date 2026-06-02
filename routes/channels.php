<?php

use App\Models\ChatRoom;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. The given channel authorization callbacks are
| used to check if an authenticated user can listen to the channel.
|
*/

Broadcast::channel('chat.{roomId}', function (User $user, string $roomId) {
    return ChatRoom::where('id', $roomId)
        ->whereHas('participants', fn ($q) => $q->where('user_id', $user->id))
        ->exists();
});
