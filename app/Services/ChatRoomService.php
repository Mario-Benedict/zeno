<?php

namespace App\Services;

use App\Enums\ProjectRole;
use App\Models\ChatRoom;
use App\Models\Project;
use App\Models\User;

/**
 * ChatRoomService
 * ----------------
 * PERBAIKAN dari versi sebelumnya:
 *
 *  1. createProjectGroupRoom() — parameter berubah dari array $memberIds
 *     menjadi string $creatorUserId saja (sesuai cara panggil di ProjectController).
 *
 *  2. Semua $project->id → $project->project_id
 *     karena Project model pakai custom PK 'project_id'.
 *
 *  3. findOrCreateDmRoom() — $project->id → $project->project_id
 *     dan tidak set 'id' manual di create() karena HasUuids handle otomatis.
 *
 *  4. addMemberToGroupRoom() & removeMemberFromProject() — sama, fix project_id.
 */
class ChatRoomService
{
    /**
     * Auto-create group room saat project baru dibuat.
     * Dipanggil dari ProjectController::store() setelah project & pivot dibuat.
     *
     * @param  string  $creatorUserId  auth()->id() dari controller
     */
    public function createProjectGroupRoom(Project $project, string $creatorUserId): ChatRoom
    {
        /** @var ChatRoom $room */
        $room = ChatRoom::create([
            'project_id' => $project->project_id,
            'type' => 'group',
            'name' => $project->project_name,
        ]);

        $members = $project->members()->get();
        $attachData = [];

        foreach ($members as $member) {
            $attachData[$member->id] = [
                'role' => (string) $member->id === (string) $creatorUserId ? 'admin' : 'member',
                'joined_at' => now(),
            ];
        }

        if (! isset($attachData[$creatorUserId])) {
            $attachData[$creatorUserId] = ['role' => 'admin', 'joined_at' => now()];
        }

        $room->participants()->attach($attachData);

        return $room;
    }

    /**
     * Tambah member baru ke group room sebuah project and return whether the
     * room membership changed. Callers broadcast only after their surrounding
     * membership transaction commits.
     */
    public function addMemberToGroupRoom(Project $project, User $user, string $projectRole = 'MEMBER'): bool
    {
        $groupRoom = ChatRoom::query()
            ->where('project_id', $project->project_id)
            ->where('type', 'group')
            ->first();

        $createdGroupRoom = false;

        if (! $groupRoom instanceof ChatRoom) {
            $groupRoom = $this->createProjectGroupRoom($project, (string) $user->id);
            $createdGroupRoom = true;
        }

        $isNewJoin = $createdGroupRoom || ! $groupRoom->participants()->whereKey($user->id)->exists();
        $chatRole = ProjectRole::tryFrom($projectRole)?->chatParticipantRole() ?? 'member';

        $groupRoom->participants()->syncWithoutDetaching([
            $user->id => [
                'role' => $chatRole,
                'joined_at' => now(),
            ],
        ]);

        return $isNewJoin;
    }

    /**
     * Prepare DM rooms after a member joins. This is intentionally invoked by
     * CreateMemberDirectMessageRooms on the queue, never by the invite request.
     */
    public function createDirectMessageRoomsForMember(Project $project, User $user): void
    {
        $project->members()
            ->where('users.id', '!=', $user->id)
            ->get()
            ->each(fn (User $existing) => $this->findOrCreateDmRoom($project, $user, $existing));
    }

    /**
     * Hapus member dari group room dan semua DM mereka di project ini.
     * Dipanggil saat user dikeluarkan dari project.
     */
    public function removeMemberFromProject(Project $project, User $user): void
    {
        ChatRoom::query()
            ->where('project_id', $project->project_id)
            ->where('type', 'group')
            ->first()
            ?->participants()
            ->detach($user->id);

        ChatRoom::query()
            ->where('project_id', $project->project_id)
            ->where('type', 'dm')
            ->whereHas('participants', fn ($q) => $q->where('user_id', $user->id))
            ->get()
            ->each(fn (ChatRoom $room) => $room->participants()->detach($user->id));
    }

    /**
     * Cari atau buat DM room antara dua user dalam sebuah project.
     *
     * De-duplikasi: cari room DM di project ini yang punya KEDUA user
     * sebagai participant. Jika belum ada, buat baru.
     */
    public function findOrCreateDmRoom(Project $project, User $userA, User $userB): ChatRoom
    {
        $existing = ChatRoom::query()
            ->where('project_id', $project->project_id)
            ->where('type', 'dm')
            ->whereHas('participants', fn ($q) => $q->where('user_id', $userA->id))
            ->whereHas('participants', fn ($q) => $q->where('user_id', $userB->id))
            ->first();

        if ($existing) {
            return $existing;
        }

        /** @var ChatRoom $room */
        $room = ChatRoom::create([
            // ✅ FIX: tidak perlu set 'id' manual — HasUuids handle otomatis
            'project_id' => $project->project_id,
            'type' => 'dm',
            'name' => null,
        ]);

        $room->participants()->attach([
            $userA->id => ['role' => 'member', 'joined_at' => now()],
            $userB->id => ['role' => 'member', 'joined_at' => now()],
        ]);

        return $room;
    }
}
