import { useEffect, useMemo, useState } from 'react';
import { useProject } from '@/hooks/useProject';
import type { ChatParticipant, ChatRoom } from '@/types/chat';
import { getRoomDisplayName } from '@/utils/chat';
import { ChatWidgetConversation } from './ChatWidgetConversation';
import { ChatWidgetRoomList } from './ChatWidgetRoomList';
import { WidgetSearchHeader } from './WidgetSearchHeader';

interface Props {
  rooms: ChatRoom[];
  currentUser: ChatParticipant;
  slotIndex: number;
}

const readPersistedRoomId = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const persistRoomId = (key: string, roomId: string | null) => {
  try {
    if (roomId) {
      localStorage.setItem(key, roomId);
    } else {
      localStorage.removeItem(key);
    }
  } catch {
    // localStorage unavailable (private browsing, quota, etc.) — the open
    // conversation just won't survive navigation, which is a harmless
    // degradation.
  }
};

/**
 * Compact, master-detail chat view for a dashboard slot — not the full chat
 * page. Built from scratch (not `components/chat`) so a single layout works
 * at any slot size: room list, or conversation with a back button, never
 * both panes side by side.
 */
export const ChatWidget = ({ rooms, currentUser, slotIndex }: Props) => {
  const { project } = useProject();
  // Scoped per project + slot so switching projects or having more than one
  // chat widget on a dashboard don't stomp on each other's open conversation.
  const storageKey = `dashboard-chat-widget:${project.project_id}:${slotIndex}`;

  const [activeRoomId, setActiveRoomId] = useState<string | null>(() =>
    readPersistedRoomId(storageKey),
  );
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const activeRoom = activeRoomId
    ? (rooms.find((room) => room.id === activeRoomId) ?? null)
    : null;

  const filteredRooms = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return rooms;

    return rooms.filter((room) =>
      getRoomDisplayName(room, currentUser).toLowerCase().includes(query),
    );
  }, [rooms, currentUser, searchQuery]);

  // The persisted room id may point at a room that's since become
  // unavailable to this user — drop it instead of getting stuck showing
  // nothing.
  useEffect(() => {
    if (activeRoomId && !activeRoom) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveRoomId(null);
      persistRoomId(storageKey, null);
    }
  }, [activeRoomId, activeRoom, storageKey]);

  const selectRoom = (room: ChatRoom | null) => {
    setActiveRoomId(room?.id ?? null);
    persistRoomId(storageKey, room?.id ?? null);
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl bg-dark-surface-2">
      {activeRoom ? (
        <ChatWidgetConversation
          key={activeRoom.id}
          room={activeRoom}
          currentUser={currentUser}
          onBack={() => selectRoom(null)}
        />
      ) : (
        <>
          <WidgetSearchHeader
            title="Chat"
            countLabel={`${rooms.length} chat${rooms.length === 1 ? '' : 's'}`}
            searchOpen={searchOpen}
            query={searchQuery}
            onQueryChange={setSearchQuery}
            onOpenSearch={() => setSearchOpen(true)}
            onCloseSearch={() => {
              setSearchOpen(false);
              setSearchQuery('');
            }}
            searchLabel="Search chats"
            placeholder="Search chats…"
          />

          <ChatWidgetRoomList
            rooms={filteredRooms}
            currentUser={currentUser}
            onSelectRoom={selectRoom}
          />
        </>
      )}
    </div>
  );
};
