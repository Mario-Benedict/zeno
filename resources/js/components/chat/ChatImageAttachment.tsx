import type { MessageAttachment } from '@/types/chat';

interface Props {
  attachment: MessageAttachment;
  withCaption?: boolean;
  timestamp?: string;
  pending?: boolean;
}

/** Renders a chat image as a linked preview once its upload is confirmed. */
const ChatImageAttachment = ({
  attachment,
  withCaption = false,
  timestamp,
  pending = false,
}: Props) => {
  const className = `relative block overflow-hidden ${
    withCaption ? 'rounded-t-2xl' : 'rounded-2xl'
  }`;
  const content = (
    <>
      <img
        src={attachment.url ?? attachment.path}
        alt={attachment.fileName}
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
      href={attachment.url ?? attachment.path}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {content}
    </a>
  );
};

export default ChatImageAttachment;
