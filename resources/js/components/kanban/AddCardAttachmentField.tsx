import { useRef, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import type { CreateKanbanCardAttachmentInput } from '@/types/kanban';
import RemoveIcon from '@public/icons/small/cancel.svg';
import FileIcon from '@public/icons/small/file.svg';
import UploadIcon from '@public/icons/small/upload.svg';

interface AddCardAttachmentFieldProps {
  attachments: CreateKanbanCardAttachmentInput[];
  onChange: (attachments: CreateKanbanCardAttachmentInput[]) => void;
}

const MAX_ATTACHMENTS = 10;
const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024;
const MAX_TOTAL_ATTACHMENT_BYTES = 50 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set([
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'pdf',
  'txt',
  'csv',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  'zip',
]);

const fileExtension = (file: File): string =>
  file.name.split('.').pop()?.toLowerCase() ?? '';

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const AddCardAttachmentField = ({
  attachments,
  onChange,
}: AddCardAttachmentFieldProps) => {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addFiles = (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    const availableSlots = MAX_ATTACHMENTS - attachments.length;

    if (files.length > availableSlots) {
      setError(t('kanban.tooManyAttachments', { count: MAX_ATTACHMENTS }));
      return;
    }

    const next: CreateKanbanCardAttachmentInput[] = [];
    for (const file of files) {
      if (file.size > MAX_ATTACHMENT_BYTES) {
        setError(t('kanban.fileTooLarge', { name: file.name }));
        return;
      }
      if (!ALLOWED_EXTENSIONS.has(fileExtension(file))) {
        setError(t('kanban.unsupportedAttachmentType', { name: file.name }));
        return;
      }

      next.push({ id: crypto.randomUUID(), file });
    }

    const totalBytes = [...attachments, ...next].reduce(
      (sum, attachment) => sum + attachment.file.size,
      0,
    );
    if (totalBytes > MAX_TOTAL_ATTACHMENT_BYTES) {
      setError(t('kanban.totalAttachmentSizeExceeded'));
      return;
    }

    setError(null);
    onChange([...attachments, ...next]);
  };

  return (
    <div>
      <div className="mb-2">
        <p className="text-xsmall font-semibold text-dark-secondary">
          {t('kanban.attachment')}
        </p>
        <p className="mt-0.5 text-micro text-dark-secondary/70">
          {t('kanban.attachmentSelectionHelp')}
        </p>
      </div>

      {attachments.length > 0 && (
        <div className="mb-2 space-y-1.5">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center gap-2 rounded-lg border border-dark-border bg-dark-surface-1 px-3 py-2"
            >
              <FileIcon className="h-4 w-4 shrink-0 text-dark-secondary" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xsmall text-dark-primary">
                  {attachment.file.name}
                </p>
                <p className="text-micro text-dark-secondary/70">
                  {formatFileSize(attachment.file.size)}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  onChange(
                    attachments.filter(
                      (candidate) => candidate.id !== attachment.id,
                    ),
                  )
                }
                aria-label={t('kanban.removeAttachment', {
                  name: attachment.file.name,
                })}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-dark-secondary transition hover:bg-accent-red/10 hover:text-accent-red"
              >
                <RemoveIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          addFiles(event.dataTransfer.files);
        }}
        className={`flex w-full items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-4 text-xsmall font-medium transition ${
          dragOver
            ? 'border-accent-blue bg-accent-blue/10 text-accent-blue'
            : 'border-dark-border text-dark-secondary hover:bg-dark-surface-3 hover:text-dark-primary'
        }`}
      >
        <UploadIcon className="h-4 w-4" />
        {t('kanban.selectAttachments')}
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.txt,.csv,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip"
        className="hidden"
        onChange={(event) => {
          if (event.target.files) addFiles(event.target.files);
          event.target.value = '';
        }}
      />

      {error && <p className="mt-2 text-xsmall text-status-error">{error}</p>}
    </div>
  );
};

export default AddCardAttachmentField;
