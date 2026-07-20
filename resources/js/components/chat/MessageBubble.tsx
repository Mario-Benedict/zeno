import ChatFileAttachment from '@/components/chat/ChatFileAttachment';
import ChatImageAttachment from '@/components/chat/ChatImageAttachment';
import ChatSenderAvatar from '@/components/chat/ChatSenderAvatar';
import { useTranslation } from '@/hooks/useTranslation';
import type { ChatMessage, ChatParticipant } from '@/types/chat';
import { senderColorClass } from '@/utils/chat';

interface Props {
  message: ChatMessage;
  currentUser: ChatParticipant;
  showHeader: boolean;
  onSenderClick?: (senderId: string) => void;
}

const formatTime = (iso: string): string =>
  new Date(iso).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

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
            <ChatImageAttachment
              attachment={attachments[0]}
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
                  {attachments.map((attachment) =>
                    attachment.type === 'image' ? (
                      <ChatImageAttachment
                        key={attachment.id}
                        attachment={attachment}
                        withCaption={hasText}
                        pending={message.pending}
                      />
                    ) : (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-center px-3 py-2"
                      >
                        <ChatFileAttachment
                          attachment={attachment}
                          pending={message.pending}
                        />
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
    if (canClickSender) onSenderClick(String(message.senderId));
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
              <ChatSenderAvatar participant={sender} />
            </button>
          ) : (
            <ChatSenderAvatar participant={sender} />
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
              {formattedTime}
            </span>
          </div>
        )}

        {isDeleted ? (
          <p className="pl-1 text-small text-dark-secondary italic">
            {t('chat.messageDeleted')}
          </p>
        ) : isImageOnly ? (
          <ChatImageAttachment
            attachment={attachments[0]}
            timestamp={formattedTime}
          />
        ) : (
          <div className="inline-block max-w-full overflow-hidden rounded-2xl rounded-bl-sm bg-dark-surface-3">
            {hasAttachments && (
              <div className="flex flex-col">
                {attachments.map((attachment, index) =>
                  attachment.type === 'image' ? (
                    <ChatImageAttachment
                      key={attachment.id}
                      attachment={attachment}
                      withCaption={hasText}
                    />
                  ) : (
                    <div
                      key={attachment.id}
                      className={[
                        'flex justify-center px-3.5 pt-2',
                        index === attachments.length - 1 && !hasText
                          ? 'pb-2'
                          : '',
                      ].join(' ')}
                    >
                      <ChatFileAttachment attachment={attachment} />
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
