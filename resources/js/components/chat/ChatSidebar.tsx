import { useEffect, useRef, useState } from 'react';
import ChatRoomItem from '@/components/chat/ChatRoomItem';
import NewDmPicker from '@/components/chat/NewDmPicker';
import NewGroupModal from '@/components/chat/NewGroupModal';
import { useTranslation } from '@/hooks/useTranslation';
import type { ChatRoom, ChatParticipant } from '@/types/chat';
import { getRoomDisplayName } from '@/utils/chat';
import PlusIcon from '@public/icons/small/plus.svg';
import SearchIcon from '@public/icons/small/search.svg';

interface Props {
  rooms: ChatRoom[];
  members: ChatParticipant[];
  currentUser: ChatParticipant;
  activeRoomId: string | null;
  onSelectRoom: (room: ChatRoom) => void;
  onStartDm: (memberId: string) => void;
  onCreateGroup: (name: string, participantIds: string[]) => void;
  creatingGroup?: boolean;
  /** Responsive visibility class controlled by the page (mobile master/detail). */
  className?: string;
}

const ChatSidebar = ({
  rooms,
  members,
  currentUser,
  activeRoomId,
  onSelectRoom,
  onStartDm,
  onCreateGroup,
  creatingGroup = false,
  className = '',
}: Props) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const pickerContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pickerOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!pickerContainerRef.current?.contains(event.target as Node)) {
        setPickerOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [pickerOpen]);

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
    <aside
      className={`relative flex h-full w-full shrink-0 flex-col overflow-hidden rounded-lg bg-dark-surface-2 md:w-55 ${className}`}
    >
      {/* ── Search bar + new message ── */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        <div className="flex flex-1 items-center gap-2 rounded-md bg-dark-input px-3 py-[7px] ring-1 ring-transparent transition-all focus-within:bg-dark-input-focus focus-within:ring-dark-border-focus">
          <SearchIcon className="h-3.5 w-3.5 shrink-0 text-dark-secondary" />
          <input
            type="text"
            placeholder={t('chat.searchChatPlaceholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-small text-dark-primary placeholder:text-dark-secondary focus:outline-none"
          />
        </div>
        <div ref={pickerContainerRef} className="relative shrink-0">
          <button
            type="button"
            title={t('chat.newMessageTitle')}
            aria-label={t('chat.newMessage')}
            aria-expanded={pickerOpen}
            onClick={() => setPickerOpen((visible) => !visible)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-dark-secondary transition-colors hover:bg-dark-surface-3 hover:text-dark-primary"
          >
            <PlusIcon className="h-4 w-4" />
          </button>
          {pickerOpen && (
            <NewDmPicker
              members={members}
              onSelect={onStartDm}
              onCreateGroup={() => setGroupModalOpen(true)}
              onClose={() => setPickerOpen(false)}
            />
          )}
        </div>
      </div>

      {groupModalOpen && (
        <NewGroupModal
          members={members}
          submitting={creatingGroup}
          onClose={() => setGroupModalOpen(false)}
          onSubmit={(name, participantIds) => {
            onCreateGroup(name, participantIds);
            setGroupModalOpen(false);
          }}
        />
      )}

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
