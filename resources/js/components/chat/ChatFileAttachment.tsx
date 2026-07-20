import { formatFileSize } from '@/lib/utils';
import type { MessageAttachment } from '@/types/chat';
import DownloadIcon from '@public/icons/small/download.svg';
import FileIcon from '@public/icons/small/file.svg';

interface Props {
  attachment: MessageAttachment;
  pending?: boolean;
}

/** Renders an uploaded file as a download link once its send is confirmed. */
const ChatFileAttachment = ({ attachment, pending = false }: Props) => {
  const href =
    attachment.downloadUrl ?? attachment.url ?? `/storage/${attachment.path}`;
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
          {attachment.fileName}
        </p>
        <p className="text-xsmall text-dark-secondary">
          {formatFileSize(attachment.size)}
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
    <a href={href} download={attachment.fileName} className={className}>
      {content}
    </a>
  );
};

export default ChatFileAttachment;
