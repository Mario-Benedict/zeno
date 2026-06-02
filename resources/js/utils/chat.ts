import type { ChatParticipant, ChatRoom } from '@/types/chat';

const hashName = (name: string): number => {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = name.charCodeAt(i) + ((h << 5) - h);
  }

  return Math.abs(h);
};

const SENDER_COLOR_CLASSES = [
  'text-accent-purple-light',
  'text-accent-cyan-light',
  'text-accent-green-light',
  'text-accent-orange-light',
  'text-accent-pink-light',
  'text-accent-blue-light',
  'text-accent-lime-light',
] as const;

export const senderColorClass = (name: string): string =>
  SENDER_COLOR_CLASSES[hashName(name) % SENDER_COLOR_CLASSES.length];

const AVATAR_BG_CLASSES = [
  'bg-accent-purple',
  'bg-accent-cyan',
  'bg-accent-green',
  'bg-accent-orange',
  'bg-accent-pink',
  'bg-accent-blue',
  'bg-accent-lime',
  'bg-accent-brown',
] as const;

export const avatarBgClass = (name: string): string =>
  AVATAR_BG_CLASSES[hashName(name) % AVATAR_BG_CLASSES.length];

export const initials = (name: string): string =>
  name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

export const getRoomDisplayName = (
  room: ChatRoom,
  currentUser: ChatParticipant,
): string => {
  if (room.type === 'group') return room.name ?? 'Group';

  const other = room.participants?.find((p) => p.id !== currentUser.id);

  return other?.name ?? 'Direct Message';
};
