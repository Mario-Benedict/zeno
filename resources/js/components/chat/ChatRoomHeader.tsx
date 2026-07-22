import RoomAvatar from '@/components/chat/RoomAvatar';
import { useTranslation } from '@/hooks/useTranslation';
import type { ChatParticipant, ChatRoom } from '@/types/chat';
import { getRoomDisplayName } from '@/utils/chat';
import ArrowLeftIcon from '@public/icons/small/arrow_left.svg';
import SearchIcon from '@public/icons/small/search.svg';

interface Props {
  room: ChatRoom;
  currentUser: ChatParticipant;
  searchActive: boolean;
  onSearchToggle: () => void;
  /** Back to the room list on mobile (master/detail). */
  onBack?: () => void;
}

const ChatRoomHeader = ({
  room,
  currentUser,
  searchActive,
  onSearchToggle,
  onBack,
}: Props) => {
  const { t } = useTranslation();
  const displayName = getRoomDisplayName(room, currentUser, {
    group: t('chat.groupFallback'),
    directMessage: t('chat.directMessageFallback'),
  });

  return (
    <header className="flex shrink-0 items-center gap-3 rounded-t-lg border-b border-dark-border bg-dark-surface-3 px-3 py-2.75 md:px-5">
      <button
        type="button"
        onClick={onBack}
        aria-label={t('common.back')}
        className="-ml-1 shrink-0 rounded-lg p-2 text-dark-secondary transition-colors hover:bg-dark-surface-2 hover:text-dark-primary md:hidden"
      >
        <ArrowLeftIcon className="h-4 w-4" />
      </button>
      <RoomAvatar room={room} currentUser={currentUser} size={32} />
      <p className="min-w-0 flex-1 truncate text-small font-semibold text-dark-primary">
        {displayName}
      </p>
      <button
        type="button"
        onClick={onSearchToggle}
        title={t('chat.searchMessages')}
        className={[
          'shrink-0 rounded-lg p-2 transition-colors',
          searchActive
            ? 'bg-dark-surface-2 text-dark-primary'
            : 'text-dark-secondary hover:bg-dark-surface-2 hover:text-dark-primary',
        ].join(' ')}
      >
        <SearchIcon className="h-4 w-4" />
      </button>
    </header>
  );
};

export default ChatRoomHeader;
