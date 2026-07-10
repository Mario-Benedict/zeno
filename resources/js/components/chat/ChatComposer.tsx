import { router, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import echo from '@/echo';
import { useTranslation } from '@/hooks/useTranslation';
import { formatFileSize } from '@/lib/utils';
import chat from '@/routes/chat';
import type { ChatMessage } from '@/types/chat';
import CancelSmallIcon from '@public/icons/small/cancel.svg';
import PaperclipIcon from '@public/icons/small/paperclip.svg';

interface Props {
  projectSlug: string;
  roomId: string;
  onMessageSent: (message: ChatMessage) => void;
  disabled?: boolean;
}

interface PendingFile {
  id: string;
  file: File;
  type: 'image' | 'file';
  previewUrl?: string;
}

const getAttachmentType = (file: File): 'image' | 'file' =>
  file.type.startsWith('image/') ? 'image' : 'file';

const getMessageType = (files: PendingFile[]): 'text' | 'image' | 'file' => {
  if (files.length === 0) return 'text';

  return files.every((f) => f.type === 'image') ? 'image' : 'file';
};

let _idCounter = 0;
const nextId = () => `pf-${++_idCounter}`;

const ArrowUpIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="19" x2="12" y2="5" />
    <polyline points="5 12 12 5 19 12" />
  </svg>
);

const FileIcon = () => (
  <svg
    width="16"
    height="16"
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
);

const AttachmentStrip = ({
  files,
  onRemove,
}: {
  files: PendingFile[];
  onRemove: (id: string) => void;
}) => {
  if (files.length === 0) return null;

  const images = files.filter((f) => f.type === 'image');
  const docs = files.filter((f) => f.type === 'file');

  return (
    <div className="space-y-2 px-3 pt-3 pb-1">
      {/* ── Image previews — WhatsApp style large thumbnails ── */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((pf) => (
            <div key={pf.id} className="relative h-16 w-16 shrink-0">
              <img
                src={pf.previewUrl}
                alt={pf.file.name}
                title={pf.file.name}
                className="h-full w-full rounded-lg border border-dark-border object-cover"
              />
              <button
                type="button"
                onClick={() => onRemove(pf.id)}
                className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-dark-border bg-dark-surface-1 text-dark-secondary shadow-sm transition-colors hover:text-dark-primary"
              >
                <CancelSmallIcon className="h-2.5 w-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── File attachments — compact chip row ── */}
      {docs.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {docs.map((pf) => (
            <div
              key={pf.id}
              className="relative flex max-w-[160px] items-center gap-1.5 rounded-lg border border-dark-border bg-dark-surface-3 px-2 py-1.5"
            >
              <span className="shrink-0 text-dark-secondary">
                <FileIcon />
              </span>
              <div className="min-w-0">
                <p className="truncate text-xsmall leading-tight text-dark-primary">
                  {pf.file.name}
                </p>
                <p className="text-xsmall leading-tight text-dark-secondary">
                  {formatFileSize(pf.file.size)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onRemove(pf.id)}
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

const ChatComposer = ({
  projectSlug,
  roomId,
  onMessageSent,
  disabled = false,
}: Props) => {
  const { t } = useTranslation();
  const accountIndex = usePage().props.account.index;
  const [body, setBody] = useState('');
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wasSendingRef = useRef(false);

  useEffect(() => {
    if (wasSendingRef.current && !sending) {
      textareaRef.current?.focus();
    }
    wasSendingRef.current = sending;
  }, [sending]);

  const adjustHeight = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 88)}px`;
  };

  const addFiles = useCallback(
    (list: FileList | null) => {
      if (!list) return;
      const MAX_SIZE = 50 * 1024 * 1024;
      const toAdd: PendingFile[] = [];

      for (const file of Array.from(list)) {
        if (pendingFiles.length + toAdd.length >= 10) break;
        if (file.size > MAX_SIZE) {
          setError(t('chat.fileExceedsSizeLimit', { name: file.name }));
          continue;
        }
        const type = getAttachmentType(file);
        const pf: PendingFile = { id: nextId(), file, type };
        if (type === 'image') pf.previewUrl = URL.createObjectURL(file);
        toAdd.push(pf);
      }
      setPendingFiles((prev) => [...prev, ...toAdd]);
    },
    [pendingFiles.length, t],
  );

  const removeFile = useCallback((id: string) => {
    setPendingFiles((prev) => {
      const pf = prev.find((f) => f.id === id);
      if (pf?.previewUrl) URL.revokeObjectURL(pf.previewUrl);

      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const send = useCallback(() => {
    const trimmed = body.trim();
    if (!trimmed && pendingFiles.length === 0) return;
    if (sending || disabled) return;

    setSending(true);
    setError(null);

    const payload: Record<string, string | File> = {
      type: pendingFiles.length > 0 ? getMessageType(pendingFiles) : 'text',
    };
    if (trimmed) payload['body'] = trimmed;
    pendingFiles.forEach((pf, i) => {
      payload[`attachments[${i}][file]`] = pf.file;
      payload[`attachments[${i}][type]`] = pf.type;
    });

    router.post(
      chat.rooms.messages.store.url({
        accountIndex,
        project: projectSlug,
        room: roomId,
      }),
      payload,
      {
        forceFormData: true,
        preserveState: true,
        preserveScroll: true,
        headers: { 'X-Socket-ID': echo.socketId() ?? '' },
        onSuccess: (page) => {
          const newMessage = (
            page.props as { flash?: { chat?: { newMessage?: ChatMessage } } }
          ).flash?.chat?.newMessage;
          if (newMessage) onMessageSent(newMessage);

          setBody('');
          setPendingFiles((prev) => {
            prev.forEach((pf) => {
              if (pf.previewUrl) URL.revokeObjectURL(pf.previewUrl);
            });

            return [];
          });
          if (fileInputRef.current) fileInputRef.current.value = '';
          if (textareaRef.current) textareaRef.current.style.height = 'auto';
        },
        onError: (errors) => {
          setError(Object.values(errors)[0] ?? t('chat.failedToSendMessage'));
        },
        onFinish: () => setSending(false),
      },
    );
  }, [
    body,
    pendingFiles,
    sending,
    disabled,
    accountIndex,
    projectSlug,
    roomId,
    onMessageSent,
    t,
  ]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const isDisabled = disabled || sending;
  const canSend =
    (body.trim().length > 0 || pendingFiles.length > 0) && !isDisabled;

  return (
    <div className="shrink-0 px-3 pt-1 pb-3">
      <AttachmentStrip files={pendingFiles} onRemove={removeFile} />

      {error && (
        <div className="mb-2 flex items-center justify-between gap-2 rounded-lg border border-status-error/30 bg-status-error/10 px-3 py-1.5">
          <p className="text-xsmall text-status-error">{error}</p>
          <button
            type="button"
            onClick={() => setError(null)}
            className="shrink-0 text-status-error hover:opacity-70"
          >
            <CancelSmallIcon className="h-2.5 w-2.5" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 rounded-xl border border-dark-border bg-dark-surface-3 px-3 py-2">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.7z"
          onChange={(e) => addFiles(e.target.files)}
        />

        <textarea
          ref={textareaRef}
          value={body}
          onChange={(e) => {
            setBody(e.target.value);
            adjustHeight();
          }}
          onKeyDown={handleKeyDown}
          placeholder={t('chat.typeAMessage')}
          disabled={isDisabled}
          rows={1}
          className="flex-1 resize-none bg-transparent text-small leading-normal text-dark-primary placeholder:text-dark-secondary focus:outline-none disabled:opacity-50"
          style={{ minHeight: '22px', maxHeight: '88px' }}
        />

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isDisabled}
            title={t('chat.attachFile')}
            className="p-1 text-dark-secondary transition-colors hover:text-dark-primary disabled:opacity-40"
          >
            <PaperclipIcon className="h-4.5 w-4.5" />
          </button>

          <button
            type="button"
            onClick={send}
            disabled={!canSend}
            title={t('chat.send')}
            className={[
              'flex h-8 w-8 items-center justify-center rounded-full transition-all',
              canSend
                ? 'bg-accent-blue text-white hover:opacity-90 active:scale-95'
                : 'cursor-not-allowed bg-dark-surface-2 text-dark-secondary',
            ].join(' ')}
          >
            {sending ? (
              <svg
                className="animate-spin"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            ) : (
              <ArrowUpIcon />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatComposer;
