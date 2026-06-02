import { formatFileSize } from '@/lib/utils';
import type {
  ChatMessage,
  ChatParticipant,
  MessageAttachment,
} from '@/types/chat';
import { avatarBgClass, initials, senderColorClass } from '@/utils/chat';

interface Props {
  message: ChatMessage;
  currentUser: ChatParticipant;
  showHeader: boolean;
  onSenderClick?: (senderId: string) => void;
}

const formatTime = (iso: string): string =>
  new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const SenderAvatar = ({
  participant,
}: {
  participant: ChatParticipant | undefined;
}) => {
  const SIZE = 28;
  const style = { width: SIZE, height: SIZE, minWidth: SIZE };

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

  const bg = avatarBgClass(participant.name);

  return (
    <span
      style={style}
      className={`inline-flex items-center justify-center rounded-full ${bg} text-xsmall font-semibold text-white`}
    >
      {initials(participant.name)}
    </span>
  );
};

const ImageAttachment = ({ att }: { att: MessageAttachment }) => (
  <a
    href={att.url ?? att.path}
    target="_blank"
    rel="noopener noreferrer"
    className="mt-1.5 block"
  >
    <img
      src={att.url ?? att.path}
      alt={att.fileName}
      className="max-h-[180px] max-w-[240px] rounded-lg border border-dark-border object-cover transition-opacity hover:opacity-90"
    />
  </a>
);

const FileAttachment = ({ att }: { att: MessageAttachment }) => {
  const href = att.url ?? `/storage/${att.path}`;

  return (
    <a
      href={href}
      download={att.fileName}
      className="mt-1.5 flex max-w-[240px] items-center gap-2.5 rounded-lg border border-dark-border bg-dark-surface-1 p-2.5 transition-colors hover:border-dark-border-focus"
    >
      <span className="flex-shrink-0 text-dark-secondary">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xsmall font-medium text-dark-primary">
          {att.fileName}
        </p>
        <p className="text-xsmall text-dark-secondary">
          {formatFileSize(att.size)}
        </p>
      </div>
      <span className="flex-shrink-0 text-dark-secondary">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      </span>
    </a>
  );
};

const MessageBubble = ({
  message,
  currentUser,
  showHeader,
  onSenderClick,
}: Props) => {
  const isOwn = String(message.senderId) === String(currentUser.id);
  const sender = message.sender;
  const isDeleted = message.isDeleted ?? false;
  const hasAttachments = message.attachments.length > 0;
  const hasText = !isDeleted && message.body?.trim().length > 0;

  if (isOwn) {
    return (
      <div
        className={['flex justify-end', showHeader ? 'mt-4' : 'mt-0.5'].join(
          ' ',
        )}
      >
        <div className="max-w-[62%]">
          {showHeader && (
            <p className="mb-1 pr-1 text-right text-xsmall text-dark-secondary">
              {formatTime(message.createdAt)}
            </p>
          )}

          {isDeleted ? (
            <p className="pr-1 text-right text-small text-dark-secondary italic">
              This message was deleted.
            </p>
          ) : (
            <div className="rounded-2xl rounded-br-sm bg-dark-surface-3 px-3.5 py-2">
              {hasText && (
                <p className="text-small break-words whitespace-pre-wrap text-dark-primary">
                  {message.body}
                </p>
              )}
              {hasAttachments && (
                <div className="flex flex-col">
                  {message.attachments.map((att) =>
                    att.type === 'image' ? (
                      <ImageAttachment key={att.id} att={att} />
                    ) : (
                      <FileAttachment key={att.id} att={att} />
                    ),
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  const nameColorClass = senderColorClass(sender?.name ?? '');
  const canClickSender =
    !!onSenderClick && String(message.senderId) !== String(currentUser.id);

  const handleSenderClick = () => {
    if (canClickSender) onSenderClick!(String(message.senderId));
  };

  return (
    <div
      className={[
        'flex items-start gap-2.5',
        showHeader ? 'mt-4' : 'mt-0.5',
      ].join(' ')}
    >
      <div className="mt-0.5 w-7 flex-shrink-0">
        {showHeader &&
          (canClickSender ? (
            <button
              type="button"
              onClick={handleSenderClick}
              className="transition-opacity hover:opacity-75"
              title={`Message ${sender?.name}`}
            >
              <SenderAvatar participant={sender} />
            </button>
          ) : (
            <SenderAvatar participant={sender} />
          ))}
      </div>

      <div className="max-w-[62%]">
        {showHeader && (
          <div className="mb-1 flex items-baseline gap-2">
            <span
              className={[
                'text-small font-semibold',
                nameColorClass,
                canClickSender ? 'cursor-pointer hover:underline' : '',
              ].join(' ')}
              onClick={handleSenderClick}
            >
              {sender?.name ?? 'Unknown'}
            </span>
            <span className="text-xsmall text-dark-secondary">
              {formatTime(message.createdAt)}
            </span>
          </div>
        )}

        {isDeleted ? (
          <p className="pl-1 text-small text-dark-secondary italic">
            This message was deleted.
          </p>
        ) : (
          <div className="inline-block max-w-full rounded-2xl rounded-bl-sm bg-dark-surface-3 px-3.5 py-2">
            {hasText && (
              <p className="text-small break-words whitespace-pre-wrap text-dark-primary">
                {message.body}
              </p>
            )}
            {hasAttachments && (
              <div className="flex flex-col">
                {message.attachments.map((att) =>
                  att.type === 'image' ? (
                    <ImageAttachment key={att.id} att={att} />
                  ) : (
                    <FileAttachment key={att.id} att={att} />
                  ),
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
