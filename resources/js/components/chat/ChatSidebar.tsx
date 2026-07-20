import { useEffect, useRef, useState } from 'react';
import ChatRoomItem from '@/components/chat/ChatRoomItem';
import NewGroupModal from '@/components/chat/NewGroupModal';
import { useTranslation } from '@/hooks/useTranslation';
import type { ChatRoom, ChatParticipant } from '@/types/chat';
import { avatarBgClass, getRoomDisplayName, initials } from '@/utils/chat';
import PlusIcon from '@public/icons/small/plus.svg';
import SearchIcon from '@public/icons/small/search.svg';
import UsersIcon from '@public/icons/small/users.svg';

interface Props {
  rooms: ChatRoom[];
  members: ChatParticipant[];
  currentUser: ChatParticipant;
  activeRoomId: string | null;
  onSelectRoom: (room: ChatRoom) => void;
  onStartDm: (memberId: string) => void;
  onCreateGroup: (name: string, participantIds: string[]) => void;
  creatingGroup?: boolean;
}

const NewDmPicker = ({
  members,
  onSelect,
  onCreateGroup,
  onClose,
}: {
  members: ChatParticipant[];
  onSelect: (memberId: string) => void;
  onCreateGroup: () => void;
  onClose: () => void;
}) => {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (!(ref.current?.contains(e.target as Node) ?? false)) onClose();
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="scrollbar-app absolute top-full right-3 z-30 mt-1 max-h-72 w-56 overflow-y-auto rounded-xl border border-dark-border bg-dark-surface-3 py-1.5 shadow-2xl"
    >
      <button
        type="button"
        onClick={() => {
          onCreateGroup();
          onClose();
        }}
        className="flex w-full items-center gap-2.5 border-b border-dark-border px-3 py-2 text-left transition-colors hover:bg-dark-surface-2"
      >
        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-dark-surface-2 text-dark-primary">
          <UsersIcon className="h-3.5 w-3.5" />
        </span>
        <span className="truncate text-small font-semibold text-dark-primary">
          {t('chat.newGroupAction')}
        </span>
      </button>
      {members.length === 0 && (
        <p className="px-3 py-4 text-center text-xsmall text-dark-secondary">
          {t('chat.noOtherMembers')}
        </p>
      )}
      {members.map((member) => (
        <button
          key={member.id}
          type="button"
          onClick={() => {
            onSelect(member.id);
            onClose();
          }}
          className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-dark-surface-2"
        >
          <span
            className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-micro font-semibold text-white ${avatarBgClass(member.name)}`}
          >
            {initials(member.name)}
          </span>
          <span className="truncate text-small text-dark-primary">
            {member.name}
          </span>
        </button>
      ))}
    </div>
  );
};

const ChatSidebar = ({
  rooms,
  members,
  currentUser,
  activeRoomId,
  onSelectRoom,
  onStartDm,
  onCreateGroup,
  creatingGroup = false,
}: Props) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [groupModalOpen, setGroupModalOpen] = useState(false);

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
    <aside className="relative flex h-full w-[200px] shrink-0 flex-col overflow-hidden rounded-lg bg-dark-surface-2">
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
        <button
          type="button"
          title={t('chat.newMessageTitle')}
          aria-label={t('chat.newMessage')}
          onClick={() => setPickerOpen((v) => !v)}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-dark-secondary transition-colors hover:bg-dark-surface-3 hover:text-dark-primary"
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
