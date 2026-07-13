import { router } from '@inertiajs/react';
import { useState, useCallback, useEffect } from 'react';
import ChatSidebar from '@/components/chat/ChatSidebar';
import ChatWindow from '@/components/chat/ChatWindow';
import echo from '@/echo';
import { useProject } from '@/hooks/useProject';
import AppLayout from '@/layouts/AppLayout';
import type { ChatRoom, ChatParticipant, ChatMessage } from '@/types/chat';

/**
 * Chat/Index.tsx
 * ---------------
 * Main entry page for the Chat feature, rendered inside AppLayout.
 *
 * Props from Inertia (ChatRoomController::index):
 *  - rooms         : ALL rooms the user participates in (incl. empty DMs)
 *  - currentUser   : the logged-in user as a ChatParticipant shape
 *  - messages      : optional — only present after a partial reload (room selected)
 *  - nextCursor    : optional — MongoDB cursor for the next older page
 *  - hasMore       : optional — whether more messages exist above
 *
 * Route: GET /u/{accountIndex}/p/{project:project_slug}/chat
 */

interface Props {
  rooms: ChatRoom[];
  currentUser: ChatParticipant;
  activeRoomId?: string | null;
  messages?: ChatMessage[];
  nextCursor?: string | null;
  hasMore?: boolean;
}

export default function Index({
  rooms,
  currentUser,
  activeRoomId: initialActiveRoomId,
}: Props) {
  const { project } = useProject();
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(
    initialActiveRoomId ?? null,
  );
  const activeRoom = rooms.find((room) => room.id === selectedRoomId) ?? null;

  /**
   * Open the DM with a given member. All DM rooms are pre-created on join
   * so they should always be findable in the rooms list — used both by
   * tap-to-DM (clicking a sender's name in a group chat) and the sidebar's
   * "new message" member picker.
   */
  const openDmWith = useCallback(
    (memberId: string) => {
      // Can't DM yourself
      if (String(memberId) === String(currentUser.id)) return;

      const dmRoom = rooms.find(
        (r) =>
          r.type === 'dm' &&
          r.participants?.some((p) => String(p.id) === String(memberId)),
      );
      if (dmRoom) setSelectedRoomId(dmRoom.id);
    },
    [rooms, currentUser.id],
  );

  // Project membership is derived from the group room's participant list —
  // every project member is a participant of the (always-present) group room.
  const members =
    rooms
      .find((r) => r.type === 'group')
      ?.participants?.filter((p) => String(p.id) !== String(currentUser.id)) ??
    [];

  // When someone else joins the project, refresh the room list so the new
  // member shows up in the group participant list and their pre-created DM
  // becomes reachable, without requiring a manual page reload.
  useEffect(() => {
    const channel = echo.private(`chat.project.${project.project_id}`);
    channel.listen('.member.joined', () => {
      router.reload({ only: ['rooms'] });
    });

    return () => {
      echo.leave(`chat.project.${project.project_id}`);
    };
  }, [project.project_id]);

  return (
    <AppLayout project={project}>
      {/* gap-2 separates sidebar and window as two distinct boxes */}
      <div className="flex h-full w-full gap-2 overflow-hidden p-2">
        <ChatSidebar
          rooms={rooms}
          members={members}
          currentUser={currentUser}
          activeRoomId={activeRoom?.id ?? null}
          onSelectRoom={(room) => setSelectedRoomId(room.id)}
          onStartDm={openDmWith}
        />
        <ChatWindow
          room={activeRoom}
          currentUser={currentUser}
          onSenderClick={openDmWith}
        />
      </div>
    </AppLayout>
  );
}
