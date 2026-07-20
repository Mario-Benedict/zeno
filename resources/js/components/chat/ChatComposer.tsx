import { router, usePage } from '@inertiajs/react';
import { useCallback, useRef, useState } from 'react';
import ChatAttachmentStrip from '@/components/chat/ChatAttachmentStrip';
import type { PendingChatFile } from '@/components/chat/ChatAttachmentStrip';
import echo from '@/echo';
import { useTranslation } from '@/hooks/useTranslation';
import { FILE_SIZE_LIMITS, isFileTooLarge } from '@/lib/fileUploads';
import chat from '@/routes/chat';
import type { ChatMessage, ChatParticipant } from '@/types/chat';
import ArrowUpIcon from '@public/icons/small/arrow_up.svg';
import CancelSmallIcon from '@public/icons/small/cancel.svg';
import PaperclipIcon from '@public/icons/small/paperclip.svg';

interface Props {
  projectSlug: string;
  roomId: string;
  currentUser: ChatParticipant;
  /** Called immediately with an optimistic message when send() is invoked. */
  onMessageSent: (message: ChatMessage) => void;
  /** Called once the server confirms the send, to replace the optimistic entry. */
  onMessageConfirmed: (tempId: string, message: ChatMessage) => void;
  /** Called if the send request fails, to mark the optimistic entry as failed. */
  onMessageFailed: (tempId: string) => void;
  disabled?: boolean;
}

const getAttachmentType = (file: File): 'image' | 'file' =>
  file.type.startsWith('image/') ? 'image' : 'file';

const getMessageType = (
  files: PendingChatFile[],
): 'text' | 'image' | 'file' => {
  if (files.length === 0) return 'text';

  return files.every((f) => f.type === 'image') ? 'image' : 'file';
};

let _tempMessageIdCounter = 0;
const nextTempMessageId = () => `temp-${Date.now()}-${++_tempMessageIdCounter}`;

let _idCounter = 0;
const nextId = () => `pf-${++_idCounter}`;

const ChatComposer = ({
  projectSlug,
  roomId,
  currentUser,
  onMessageSent,
  onMessageConfirmed,
  onMessageFailed,
  disabled = false,
}: Props) => {
  const { t } = useTranslation();
  const accountIndex = usePage().props.account.index;
  const [body, setBody] = useState('');
  const [pendingFiles, setPendingFiles] = useState<PendingChatFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Debounces a genuinely simultaneous double-fire (e.g. Enter key repeat)
  // without blocking the composer for the whole network round-trip the way
  // a `sending` state tied to `disabled` would — sends are optimistic now,
  // so multiple can be in flight at once.
  const isSendingRef = useRef(false);

  const adjustHeight = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 88)}px`;
  };

  const addFiles = useCallback(
    (list: FileList | null) => {
      if (!list) return;
      const toAdd: PendingChatFile[] = [];
      const pendingSize = pendingFiles.reduce(
        (total, pendingFile) => total + pendingFile.file.size,
        0,
      );

      for (const file of Array.from(list)) {
        if (pendingFiles.length + toAdd.length >= 10) break;
        if (isFileTooLarge(file, FILE_SIZE_LIMITS.chatAttachment)) {
          setError(t('chat.fileExceedsSizeLimit', { name: file.name }));
          continue;
        }
        const addedSize = toAdd.reduce(
          (total, pendingFile) => total + pendingFile.file.size,
          0,
        );
        if (
          pendingSize + addedSize + file.size >
          FILE_SIZE_LIMITS.chatRequest
        ) {
          setError(t('chat.attachmentsExceedTotalSizeLimit'));
          continue;
        }
        const type = getAttachmentType(file);
        const pf: PendingChatFile = { id: nextId(), file, type };
        if (type === 'image') pf.previewUrl = URL.createObjectURL(file);
        toAdd.push(pf);
      }
      setPendingFiles((prev) => [...prev, ...toAdd]);
    },
    [pendingFiles, t],
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
    if (disabled || isSendingRef.current) return;

    // Only guards against a re-entrant call within this same synchronous
    // pass (e.g. a duplicated event) — released below once body/pendingFiles
    // are cleared, not tied to the network round-trip, so the next distinct
    // send (a separate call stack entirely) is never blocked by it.
    isSendingRef.current = true;

    setError(null);

    const tempId = nextTempMessageId();
    const now = new Date().toISOString();
    const messageType =
      pendingFiles.length > 0 ? getMessageType(pendingFiles) : 'text';
    const filesToSend = pendingFiles;

    // Show the message in the list right away — saving happens in the
    // background below, so the composer is free for the next one instead
    // of waiting out the round-trip.
    onMessageSent({
      _id: tempId,
      roomId,
      senderId: currentUser.id,
      sender: currentUser,
      type: messageType,
      body: trimmed,
      attachments: filesToSend.map((pf) => ({
        id: pf.id,
        type: pf.type,
        fileName: pf.file.name,
        mimeType: pf.file.type || 'application/octet-stream',
        size: pf.file.size,
        path: '',
        url: pf.type === 'image' ? pf.previewUrl : undefined,
      })),
      createdAt: now,
      updatedAt: now,
      pending: true,
    });

    const payload: Record<string, string | File> = { type: messageType };
    if (trimmed) payload['body'] = trimmed;
    filesToSend.forEach((pf, i) => {
      payload[`attachments[${i}][file]`] = pf.file;
      payload[`attachments[${i}][type]`] = pf.type;
    });

    // Only attach the header when Echo has an active socket ID — an empty
    // string still counts as "present" to the backend (Laravel's
    // Broadcast::socket() returns it as-is) and Pusher/Reverb's SDK rejects
    // any non-null socket ID that isn't in the "digits.digits" form,
    // throwing "Invalid socket ID" instead of just skipping the exclusion.
    const socketId = echo.socketId();

    setBody('');
    setPendingFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    isSendingRef.current = false;

    const revokePreviews = () => {
      filesToSend.forEach((pf) => {
        if (pf.previewUrl) URL.revokeObjectURL(pf.previewUrl);
      });
    };

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
        headers: socketId ? { 'X-Socket-ID': socketId } : {},
        onSuccess: (page) => {
          const newMessage = (
            page.props as { flash?: { chat?: { newMessage?: ChatMessage } } }
          ).flash?.chat?.newMessage;
          if (newMessage) {
            onMessageConfirmed(tempId, newMessage);
          } else {
            onMessageFailed(tempId);
          }
          revokePreviews();
        },
        onError: (errors) => {
          onMessageFailed(tempId);
          setError(Object.values(errors)[0] ?? t('chat.failedToSendMessage'));
          revokePreviews();
        },
      },
    );
  }, [
    body,
    pendingFiles,
    disabled,
    currentUser,
    accountIndex,
    projectSlug,
    roomId,
    onMessageSent,
    onMessageConfirmed,
    onMessageFailed,
    t,
  ]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const canSend =
    (body.trim().length > 0 || pendingFiles.length > 0) && !disabled;

  return (
    <div className="shrink-0 px-3 pt-1 pb-3">
      <ChatAttachmentStrip files={pendingFiles} onRemove={removeFile} />

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
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none bg-transparent text-small leading-normal text-dark-primary placeholder:text-dark-secondary focus:outline-none disabled:opacity-50"
          style={{ minHeight: '22px', maxHeight: '88px' }}
        />

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
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
            <ArrowUpIcon />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatComposer;
