import { router, usePage } from '@inertiajs/react';
import { useState, useCallback, useEffect, useRef } from 'react';
import ChatSidebar from '@/components/chat/ChatSidebar';
import ChatWindow from '@/components/chat/ChatWindow';
import echo from '@/echo';
import { useProject } from '@/hooks/useProject';
import { useTranslation } from '@/hooks/useTranslation';
import AppLayout from '@/layouts/AppLayout';
import chatRooms from '@/routes/chat/rooms';
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
  activeMessageId?: string | null;
  messages?: ChatMessage[];
  nextCursor?: string | null;
  hasMore?: boolean;
}

export default function Index({
  rooms,
  currentUser,
  activeRoomId: initialActiveRoomId,
  activeMessageId,
}: Props) {
  const { project, accountIndex } = useProject();
  const { projectShare } = usePage().props;
  const { t } = useTranslation();
  const [liveRooms, setLiveRooms] = useState(rooms);
  const [realtimeMessages, setRealtimeMessages] = useState<ChatMessage[]>([]);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(
    initialActiveRoomId ?? null,
  );
  const selectedRoomIdRef = useRef(selectedRoomId);
  const activeRoom =
    liveRooms.find((room) => room.id === selectedRoomId) ?? null;

  useEffect(() => {
    selectedRoomIdRef.current = selectedRoomId;
  }, [selectedRoomId]);

  useEffect(() => {
    // Server reloads replace room membership and authoritative unread counts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLiveRooms(rooms);
  }, [rooms]);

  // Picks up the room a fresh find-or-create POST (see openDmWith below)
  // flashes back as `activeRoomId`, since that prop only seeds state once on
  // mount otherwise.
  useEffect(() => {
    if (!initialActiveRoomId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedRoomId(initialActiveRoomId);
  }, [initialActiveRoomId]);

  const updateRoomFromMessage = useCallback(
    (message: ChatMessage) => {
      setLiveRooms((currentRooms) =>
        currentRooms
          .map((room) => {
            if (room.id !== message.roomId) return room;

            const isOwnMessage =
              String(message.senderId) === String(currentUser.id);
            const isOpen = room.id === selectedRoomIdRef.current;
            const body =
              message.body ||
              (message.type === 'image'
                ? t('chat.sentAnImage')
                : t('chat.sentAFile'));

            return {
              ...room,
              lastMessage: {
                body,
                senderName:
                  message.sender?.name ??
                  (isOwnMessage ? currentUser.name : t('common.unknown')),
                createdAt: message.createdAt,
              },
              unreadCount: isOwnMessage || isOpen ? 0 : room.unreadCount + 1,
              updatedAt: message.createdAt,
            };
          })
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
      );
    },
    [currentUser.id, currentUser.name, t],
  );

  /**
   * Open the DM with a given member. DM rooms are normally pre-created on
   * join, so the common case is just finding it in the rooms list already
   * loaded — used both by tap-to-DM (clicking a sender's name in a group
   * chat) and the sidebar's "new message" member picker. If one isn't found
   * (e.g. the pre-creation pass hasn't run for this member yet), fall back
   * to the find-or-create endpoint instead of silently doing nothing.
   */
  const openDmWith = useCallback(
    (memberId: string) => {
      // Can't DM yourself
      if (String(memberId) === String(currentUser.id)) return;

      const dmRoom = liveRooms.find(
        (r) =>
          r.type === 'dm' &&
          r.participants?.some((p) => String(p.id) === String(memberId)),
      );
      if (dmRoom) {
        setSelectedRoomId(dmRoom.id);
        return;
      }

      router.post(
        chatRooms.store.url({ accountIndex, project: project.project_slug }),
        { recipient_id: memberId },
        { preserveScroll: true },
      );
    },
    [liveRooms, currentUser.id, accountIndex, project.project_slug],
  );

  /** Creates a new group room with a chosen subset of project members. */
  const createGroup = useCallback(
    (name: string, participantIds: string[]) => {
      setCreatingGroup(true);
      router.post(
        chatRooms.group.store.url({
          accountIndex,
          project: project.project_slug,
        }),
        { name, participant_ids: participantIds },
        {
          preserveScroll: true,
          onFinish: () => setCreatingGroup(false),
        },
      );
    },
    [accountIndex, project.project_slug],
  );

  // Project membership comes from projectShare (authoritative project_user
  // membership), not the group room's participant list — a member can exist
  // in the project before the group room's participant sync has caught up.
  const members: ChatParticipant[] = (projectShare?.members ?? [])
    .filter((m) => !m.is_current_user)
    .map((m) => ({
      id: String(m.id),
      name: m.name,
      email: m.email,
    }));

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

  useEffect(() => {
    const subscriptions = rooms.map((room) => {
      const channel = echo.private(`chat.${room.id}`);
      const listener = (event: { message: ChatMessage }) => {
        updateRoomFromMessage(event.message);
        setRealtimeMessages((current) => [
          ...current.slice(-99),
          event.message,
        ]);
      };
      channel.listen('.message.sent', listener);

      return { channel, listener, roomId: room.id };
    });

    return () => {
      subscriptions.forEach(({ channel, listener, roomId }) => {
        channel.stopListening('.message.sent', listener);
        echo.leave(`chat.${roomId}`);
      });
    };
  }, [rooms, updateRoomFromMessage]);

  const selectRoom = useCallback((room: ChatRoom) => {
    selectedRoomIdRef.current = room.id;
    setSelectedRoomId(room.id);
    setLiveRooms((currentRooms) =>
      currentRooms.map((item) =>
        item.id === room.id ? { ...item, unreadCount: 0 } : item,
      ),
    );
  }, []);

  return (
    <AppLayout project={project}>
      {/* gap-2 separates sidebar and window as two distinct boxes */}
      <div className="flex h-full w-full gap-2 overflow-hidden p-2">
        <ChatSidebar
          rooms={liveRooms}
          members={members}
          currentUser={currentUser}
          activeRoomId={activeRoom?.id ?? null}
          onSelectRoom={selectRoom}
          onStartDm={openDmWith}
          onCreateGroup={createGroup}
          creatingGroup={creatingGroup}
        />
        <ChatWindow
          room={activeRoom}
          currentUser={currentUser}
          targetMessageId={
            activeRoom?.id === initialActiveRoomId
              ? (activeMessageId ?? null)
              : null
          }
          onSenderClick={openDmWith}
          onMessageSent={updateRoomFromMessage}
          realtimeMessages={realtimeMessages}
        />
      </div>
    </AppLayout>
  );
}
