<?php

namespace App\Policies;

use App\Models\ChatRoom;
use App\Models\User;

/**
 * ChatRoomPolicy
 * ---------------
 * Authorization rules for ChatRoom actions.
 *
 * All policies assume the user is already authenticated (the `auth` middleware
 * is applied to every chat route). The checks here enforce project-scoped
 * membership — a user can only interact with rooms they belong to.
 *
 * Registration: add to AuthServiceProvider::$policies or use auto-discovery.
 */
class ChatRoomPolicy
{
    /**
     * view — can the user see this room and its messages?
     * Allowed if the user is a participant of the room.
     */
    public function view(User $user, ChatRoom $room): bool
    {
        return $this->isParticipant($user, $room);
    }

    /**
     * sendMessage — can the user post a message in this room?
     * Same as view: any participant may send messages.
     */
    public function sendMessage(User $user, ChatRoom $room): bool
    {
        return $this->isParticipant($user, $room);
    }

    /**
     * update — can the user rename or change the avatar of this room?
     * Restricted to group rooms where the user holds the admin role.
     */
    public function update(User $user, ChatRoom $room): bool
    {
        if ($room->type !== 'group') {
            return false;
        }

        return $this->isAdmin($user, $room);
    }

    /**
     * manageMembers — can the user add or remove participants?
     * Restricted to group room admins.
     */
    public function manageMembers(User $user, ChatRoom $room): bool
    {
        if ($room->type !== 'group') {
            return false;
        }

        return $this->isAdmin($user, $room);
    }

    /**
     * createDm — can the user open a DM with another user in this project?
     * Both users must be participants of the project's group room.
     */
    public function createDm(User $user, ChatRoom $groupRoom): bool
    {
        return $this->isParticipant($user, $groupRoom);
    }



    private function isParticipant(User $user, ChatRoom $room): bool
    {
        return $room->participants()
            ->where('user_id', $user->id)
            ->exists();
    }

    private function isAdmin(User $user, ChatRoom $room): bool
    {
        return $room->participants()
            ->where('user_id', $user->id)
            ->wherePivot('role', 'admin')
            ->exists();
    }
}