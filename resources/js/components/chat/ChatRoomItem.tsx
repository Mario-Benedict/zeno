import RoomAvatar from '@/components/chat/RoomAvatar';
import { useTranslation } from '@/hooks/useTranslation';
import type { ChatRoom, ChatParticipant } from '@/types/chat';
import { getRoomDisplayName } from '@/utils/chat';

interface Props {
  room: ChatRoom;
  currentUser: ChatParticipant;
  isActive: boolean;
  onClick: () => void;
}

const ChatRoomItem = ({ room, currentUser, isActive, onClick }: Props) => {
  const { t } = useTranslation();
  const displayName = getRoomDisplayName(room, currentUser, {
    group: t('chat.groupFallback'),
    directMessage: t('chat.directMessageFallback'),
  });
  const lastMsgBody = room.lastMessage?.body ?? '';
  const lastMsgSender = room.lastMessage?.senderName;
  const preview = lastMsgBody
    ? lastMsgSender && room.type === 'group'
      ? `${lastMsgSender}: ${lastMsgBody}`
      : lastMsgBody
    : t('chat.noMessagesInRoom');

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors',
        isActive ? 'bg-dark-surface-3' : 'hover:bg-dark-surface-3/60',
      ].join(' ')}
    >
      <RoomAvatar room={room} currentUser={currentUser} size={32} />

      <div className="min-w-0 flex-1">
        <p className="truncate text-small leading-snug font-medium text-dark-primary">
          {displayName}
        </p>
        <p className="mt-0.5 truncate text-xsmall leading-snug text-dark-secondary">
          {preview}
        </p>
      </div>
    </button>
  );
};

export default ChatRoomItem;
