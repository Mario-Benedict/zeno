<?php

use App\Models\ChatRoom;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Auth; // Mengimpor Auth untuk menghilangkan eror Intelephense

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

Broadcast::channel('note.{noteId}', function ($user, $noteId) {
    // Karena parameter $user hanya akan terisi jika user sudah login, 
    // kita cukup memastikan objek $user tersebut valid dan ada di sistem
    if ($user) {
        return ['id' => $user->id, 'name' => $user->name];
    }
    return false;
});