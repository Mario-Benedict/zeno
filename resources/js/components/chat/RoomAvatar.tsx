import { useTranslation } from '@/hooks/useTranslation';
import type { ChatRoom, ChatParticipant } from '@/types/chat';
import { avatarBgClass, getRoomDisplayName, initials } from '@/utils/chat';
import UsersIconSvg from '@public/icons/small/users.svg';

interface Props {
  room: ChatRoom;
  currentUser: ChatParticipant;
  size?: number;
}

const UsersIcon = ({ size }: { size: number }) => (
  <UsersIconSvg width={size} height={size} aria-hidden />
);

const RoomAvatar = ({ room, currentUser, size = 36 }: Props) => {
  const { t } = useTranslation();
  const dim = { width: size, height: size };
  const style = { ...dim, minWidth: size };
  const textClass = size >= 36 ? 'text-xsmall' : 'text-micro';

  if (room.type === 'group') {
    if (room.avatarUrl) {
      return (
        <img
          src={room.avatarUrl}
          alt={room.name ?? t('common.members')}
          style={style}
          className="rounded-full object-cover"
        />
      );
    }
    const bg = avatarBgClass(room.name ?? 'G');

    return (
      <span
        style={style}
        className={`inline-flex items-center justify-center rounded-full ${bg} shrink-0`}
      >
        <UsersIcon size={Math.round(size * 0.44)} />
      </span>
    );
  }

  const other = room.participants?.find((p) => p.id !== currentUser.id) ?? null;

  if (other?.avatarUrl) {
    return (
      <img
        src={other.avatarUrl}
        alt={other.name}
        style={style}
        className="shrink-0 rounded-full object-cover"
      />
    );
  }

  const name = getRoomDisplayName(room, currentUser, {
    group: t('chat.groupFallback'),
    directMessage: t('chat.directMessageFallback'),
  });
  const bg = avatarBgClass(name);

  return (
    <span
      style={style}
      className={`inline-flex items-center justify-center rounded-full ${bg} shrink-0 font-semibold text-white ${textClass}`}
    >
      {initials(name)}
    </span>
  );
};

export default RoomAvatar;
