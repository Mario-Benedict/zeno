import { useTranslation } from '@/hooks/useTranslation';
import type { ChatRoom, ChatParticipant } from '@/types/chat';
import { avatarBgClass, getRoomDisplayName, initials } from '@/utils/chat';

interface Props {
  room: ChatRoom;
  currentUser: ChatParticipant;
  size?: number;
}

const UsersIcon = ({ size }: { size: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
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

  const name = getRoomDisplayName(room, currentUser);
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
