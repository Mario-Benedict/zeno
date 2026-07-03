import { useState } from 'react';
import type { ChatParticipant, ChatRoom } from '@/types/chat';
import { ChatWidgetConversation } from './ChatWidgetConversation';
import { ChatWidgetRoomList } from './ChatWidgetRoomList';

interface Props {
  rooms: ChatRoom[];
  currentUser: ChatParticipant;
}

/**
 * Compact, master-detail chat view for a dashboard slot — not the full chat
 * page. Built from scratch (not `components/chat`) so a single layout works
 * at any slot size: room list, or conversation with a back button, never
 * both panes side by side.
 */
export const ChatWidget = ({ rooms, currentUser }: Props) => {
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);

  const activeRoom = activeRoomId
    ? (rooms.find((room) => room.id === activeRoomId) ?? null)
    : null;

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl bg-dark-surface-2">
      {activeRoom ? (
        <ChatWidgetConversation
          key={activeRoom.id}
          room={activeRoom}
          currentUser={currentUser}
          onBack={() => setActiveRoomId(null)}
        />
      ) : (
        <>
          <div className="flex shrink-0 items-center justify-between px-3 pt-3 pb-2">
            <span className="text-small font-semibold text-dark-primary">
              Chat
            </span>
            <span className="text-xsmall text-white/30">
              {rooms.length} chat{rooms.length === 1 ? '' : 's'}
            </span>
          </div>

          <ChatWidgetRoomList
            rooms={rooms}
            currentUser={currentUser}
            onSelectRoom={(room) => setActiveRoomId(room.id)}
          />
        </>
      )}
    </div>
  );
};
