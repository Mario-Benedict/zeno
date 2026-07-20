import { useTranslation } from '@/hooks/useTranslation';
import { formatFileSize } from '@/lib/utils';
import type {
  ChatMessage,
  ChatParticipant,
  MessageAttachment,
} from '@/types/chat';
import { avatarBgClass, initials, senderColorClass } from '@/utils/chat';
import DownloadIcon from '@public/icons/small/download.svg';
import FileIcon from '@public/icons/small/file.svg';

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

/**
 * Image attachment — WhatsApp-style.
 * Renders the image as the bubble itself when standalone (no caption);
 * when a caption is present it sits flush at the top of a captioned bubble.
 * While `pending` (an optimistic send still saving), renders as a plain
 * `div` instead of a link — the local blob preview isn't a real URL to
 * navigate to yet.
 */
const ImageAttachment = ({
  att,
  withCaption = false,
  timestamp,
  pending = false,
}: {
  att: MessageAttachment;
  withCaption?: boolean;
  timestamp?: string;
  pending?: boolean;
}) => {
  const className = `relative block overflow-hidden ${
    withCaption ? 'rounded-t-2xl' : 'rounded-2xl'
  }`;
  const content = (
    <>
      <img
        src={att.url ?? att.path}
        alt={att.fileName}
        className={`block max-h-80 min-h-30 max-w-70 min-w-45 object-cover transition-opacity ${
          pending ? 'opacity-60' : 'hover:opacity-90'
        }`}
      />
      {timestamp && !withCaption && (
        <span className="pointer-events-none absolute right-2 bottom-2 rounded-md bg-black/55 px-1.5 py-0.5 text-micro font-medium text-dark-primary backdrop-blur-sm">
          {timestamp}
        </span>
      )}
    </>
  );

  if (pending) {
    return <div className={className}>{content}</div>;
  }

  return (
    <a
      href={att.url ?? att.path}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {content}
    </a>
  );
};

/**
 * While `pending`, renders as a plain `div` instead of a link — the
 * attachment has no real download URL until the send is confirmed.
 */
const FileAttachment = ({
  att,
  pending = false,
}: {
  att: MessageAttachment;
  pending?: boolean;
}) => {
  const href = att.downloadUrl ?? att.url ?? `/storage/${att.path}`;
  const className = `mt-1.5 flex max-w-60 items-center gap-2.5 rounded-lg border border-dark-border bg-dark-surface-1 p-2.5 transition-colors ${
    pending ? '' : 'hover:border-dark-border-focus'
  }`;
  const content = (
    <>
      <span className="shrink-0 text-dark-secondary">
        <FileIcon className="h-[18px] w-[18px]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xsmall font-medium text-dark-primary">
          {att.fileName}
        </p>
        <p className="text-xsmall text-dark-secondary">
          {formatFileSize(att.size)}
        </p>
      </div>
      <span className="shrink-0 text-dark-secondary">
        <DownloadIcon />
      </span>
    </>
  );

  if (pending) {
    return <div className={className}>{content}</div>;
  }

  return (
    <a href={href} download={att.fileName} className={className}>
      {content}
    </a>
  );
};

const MessageBubble = ({
  message,
  currentUser,
  showHeader,
  onSenderClick,
}: Props) => {
  const { t } = useTranslation();
  const isOwn = String(message.senderId) === String(currentUser.id);
  const sender = message.sender;
  const isDeleted = message.isDeleted ?? false;
  const attachments = message.attachments;
  const hasAttachments = attachments.length > 0;
  const hasText = !isDeleted && message.body?.trim().length > 0;
  const formattedTime = formatTime(message.createdAt);

  // WhatsApp-style: an image-only message (single image, no caption, no other
  // file attachments) renders as a bare image bubble — no padding, no chrome,
  // timestamp overlaid on the image.
  const isImageOnly =
    !isDeleted &&
    !hasText &&
    attachments.length === 1 &&
    attachments[0].type === 'image';

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
              {formattedTime}
            </p>
          )}

          {isDeleted ? (
            <p className="pr-1 text-right text-small text-dark-secondary italic">
              {t('chat.messageDeleted')}
            </p>
          ) : isImageOnly ? (
            <ImageAttachment
              att={attachments[0]}
              timestamp={formattedTime}
              pending={message.pending}
            />
          ) : (
            <div
              className={[
                'overflow-hidden rounded-2xl rounded-br-sm bg-dark-surface-3',
                message.pending ? 'opacity-60' : '',
                message.failed ? 'ring-1 ring-status-error' : '',
              ].join(' ')}
            >
              {hasAttachments && (
                <div className="flex flex-col">
                  {attachments.map((att) =>
                    att.type === 'image' ? (
                      <ImageAttachment
                        key={att.id}
                        att={att}
                        withCaption={hasText}
                        pending={message.pending}
                      />
                    ) : (
                      <div
                        key={att.id}
                        className="flex items-center justify-center px-3 py-2"
                      >
                        <FileAttachment att={att} pending={message.pending} />
                      </div>
                    ),
                  )}
                </div>
              )}
              {hasText && (
                <p className="px-3.5 py-2 text-small wrap-break-word whitespace-pre-wrap text-dark-primary">
                  {message.body}
                </p>
              )}
            </div>
          )}

          {message.failed && (
            <p className="mt-1 pr-1 text-right text-xsmall text-status-error">
              {t('chat.messageFailedToSend')}
            </p>
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
      <div className="mt-0.5 w-7 shrink-0">
        {showHeader &&
          (canClickSender ? (
            <button
              type="button"
              onClick={handleSenderClick}
              className="transition-opacity hover:opacity-75"
              title={t('chat.messageFromSender', { name: sender?.name ?? '' })}
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
              {sender?.name ?? t('common.unknown')}
            </span>
            <span className="text-xsmall text-dark-secondary">
              {formatTime(message.createdAt)}
            </span>
          </div>
        )}

        {isDeleted ? (
          <p className="pl-1 text-small text-dark-secondary italic">
            {t('chat.messageDeleted')}
          </p>
        ) : isImageOnly ? (
          <ImageAttachment att={attachments[0]} timestamp={formattedTime} />
        ) : (
          <div className="inline-block max-w-full overflow-hidden rounded-2xl rounded-bl-sm bg-dark-surface-3">
            {hasAttachments && (
              <div className="flex flex-col">
                {attachments.map((att, i) =>
                  att.type === 'image' ? (
                    <ImageAttachment
                      key={att.id}
                      att={att}
                      withCaption={hasText}
                    />
                  ) : (
                    <div
                      key={att.id}
                      className={[
                        'flex justify-center px-3.5 pt-2',
                        i === attachments.length - 1 && !hasText ? 'pb-2' : '',
                      ].join(' ')}
                    >
                      <FileAttachment att={att} />
                    </div>
                  ),
                )}
              </div>
            )}
            {hasText && (
              <p className="px-3.5 py-2 text-small wrap-break-word whitespace-pre-wrap text-dark-primary">
                {message.body}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
