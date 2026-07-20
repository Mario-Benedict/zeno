import { formatFileSize } from '@/lib/utils';
import CancelSmallIcon from '@public/icons/small/cancel.svg';
import FileIcon from '@public/icons/small/file.svg';

export interface PendingChatFile {
  id: string;
  file: File;
  type: 'image' | 'file';
  previewUrl?: string;
}

interface Props {
  files: PendingChatFile[];
  onRemove: (id: string) => void;
}

const ChatAttachmentStrip = ({ files, onRemove }: Props) => {
  if (files.length === 0) return null;

  const images = files.filter((file) => file.type === 'image');
  const documents = files.filter((file) => file.type === 'file');

  return (
    <div className="space-y-2 px-3 pt-3 pb-1">
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((pendingFile) => (
            <div key={pendingFile.id} className="relative h-16 w-16 shrink-0">
              <img
                src={pendingFile.previewUrl}
                alt={pendingFile.file.name}
                title={pendingFile.file.name}
                className="h-full w-full rounded-lg border border-dark-border object-cover"
              />
              <button
                type="button"
                onClick={() => onRemove(pendingFile.id)}
                className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-dark-border bg-dark-surface-1 text-dark-secondary shadow-sm transition-colors hover:text-dark-primary"
              >
                <CancelSmallIcon className="h-2.5 w-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {documents.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {documents.map((pendingFile) => (
            <div
              key={pendingFile.id}
              className="relative flex max-w-[160px] items-center gap-1.5 rounded-lg border border-dark-border bg-dark-surface-3 px-2 py-1.5"
            >
              <span className="shrink-0 text-dark-secondary">
                <FileIcon />
              </span>
              <div className="min-w-0">
                <p className="truncate text-xsmall leading-tight text-dark-primary">
                  {pendingFile.file.name}
                </p>
                <p className="text-xsmall leading-tight text-dark-secondary">
                  {formatFileSize(pendingFile.file.size)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onRemove(pendingFile.id)}
                className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full border border-dark-border bg-dark-surface-1 text-dark-secondary transition-colors hover:text-dark-primary"
              >
                <CancelSmallIcon className="h-2.5 w-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatAttachmentStrip;
