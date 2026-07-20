import type { ChatParticipant } from '@/types/chat';
import { avatarBgClass, initials } from '@/utils/chat';

interface Props {
  participant: ChatParticipant | undefined;
}

const AVATAR_SIZE = 28;

const ChatSenderAvatar = ({ participant }: Props) => {
  const style = {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    minWidth: AVATAR_SIZE,
  };

  if (!participant) {
    return (
      <span
        style={style}
        className="inline-flex items-center justify-center rounded-full bg-dark-surface-3 text-xsmall font-semibold text-dark-secondary"
      >
        ?
      </span>
    );
  }

  if (participant.avatarUrl) {
    return (
      <img
        src={participant.avatarUrl}
        alt={participant.name}
        style={style}
        className="rounded-full object-cover"
      />
    );
  }

  return (
    <span
      style={style}
      className={`inline-flex items-center justify-center rounded-full ${avatarBgClass(participant.name)} text-xsmall font-semibold text-white`}
    >
      {initials(participant.name)}
    </span>
  );
};

export default ChatSenderAvatar;
