import { useState } from 'react';
import ChatRoomItem from '@/components/chat/ChatRoomItem';
import { useTranslation } from '@/hooks/useTranslation';
import type { ChatRoom, ChatParticipant } from '@/types/chat';
import { getRoomDisplayName } from '@/utils/chat';
import SearchIcon from '@public/icons/small/search.svg';

interface Props {
  rooms: ChatRoom[];
  currentUser: ChatParticipant;
  activeRoomId: string | null;
  onSelectRoom: (room: ChatRoom) => void;
}

const ChatSidebar = ({
  rooms,
  currentUser,
  activeRoomId,
  onSelectRoom,
}: Props) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');

  const hasQuery = query.trim().length > 0;

  const filtered = rooms.filter((r) => {
    const nameMatch = getRoomDisplayName(r, currentUser, {
      group: t('chat.groupFallback'),
      directMessage: t('chat.directMessageFallback'),
    })
      .toLowerCase()
      .includes(query.toLowerCase());
    if (!nameMatch) return false;
    if (r.type === 'dm' && !r.lastMessage && !hasQuery) return false;

    return true;
  });

  return (
    <aside className="flex h-full w-[200px] shrink-0 flex-col overflow-hidden rounded-lg bg-dark-surface-2">
      {/* ── Search bar ── */}
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-center gap-2 rounded-md bg-dark-input px-3 py-[7px] ring-1 ring-transparent transition-all focus-within:bg-dark-input-focus focus-within:ring-dark-border-focus">
          <SearchIcon className="h-3.5 w-3.5 shrink-0 text-dark-secondary" />
          <input
            type="text"
            placeholder={t('chat.searchChatPlaceholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-small text-dark-primary placeholder:text-dark-secondary focus:outline-none"
          />
        </div>
      </div>

      {/* ── Room list ── */}
      <nav className="scrollbar-app flex-1 overflow-y-auto">
        {filtered.map((room) => (
          <ChatRoomItem
            key={room.id}
            room={room}
            currentUser={currentUser}
            isActive={room.id === activeRoomId}
            onClick={() => onSelectRoom(room)}
          />
        ))}

        {filtered.length === 0 && (
          <p className="px-4 py-6 text-center text-xsmall text-dark-secondary">
            {t('chat.noChatsFound')}
          </p>
        )}
      </nav>
    </aside>
  );
};

export default ChatSidebar;
