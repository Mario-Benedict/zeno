import { useTranslation } from '@/hooks/useTranslation';
import type { ChatParticipant, ChatRoom } from '@/types/chat';
import { avatarBgClass, getRoomDisplayName, initials } from '@/utils/chat';

interface Props {
  rooms: ChatRoom[];
  currentUser: ChatParticipant;
  onSelectRoom: (room: ChatRoom) => void;
}

export const ChatWidgetRoomList = ({
  rooms,
  currentUser,
  onSelectRoom,
}: Props) => {
  const { t } = useTranslation();

  return (
    <div className="scrollbar-app flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-1.5 pb-2">
      {rooms.length === 0 ? (
        <p className="px-3 py-6 text-center text-xsmall text-white/30">
          {t('dashboard.noChatsYet')}
        </p>
      ) : (
        rooms.map((room) => {
          const name = getRoomDisplayName(room, currentUser, {
            group: t('chat.groupFallback'),
            directMessage: t('chat.directMessageFallback'),
          });

          return (
            <button
              key={room.id}
              type="button"
              onClick={() => onSelectRoom(room)}
              className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-left transition hover:bg-white/5"
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xsmall font-semibold text-white ${avatarBgClass(name)}`}
              >
                {initials(name)}
              </span>
              <span className="min-w-0 flex-1">
                <p className="truncate text-xsmall font-medium text-white/90">
                  {name}
                </p>
                <p className="truncate text-micro text-white/40">
                  {room.lastMessage
                    ? `${room.lastMessage.senderName}: ${room.lastMessage.body}`
                    : t('dashboard.noMessagesShort')}
                </p>
              </span>
            </button>
          );
        })
      )}
    </div>
  );
};
