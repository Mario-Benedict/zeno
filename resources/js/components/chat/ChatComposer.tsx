import React, { useRef, useState, useCallback } from 'react';
import { router, usePage } from '@inertiajs/react';
import type { ChatMessage } from '@/types/chat';
import echo from '@/echo';

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


function getAttachmentType(file: File): 'image' | 'file' {
    return file.type.startsWith('image/') ? 'image' : 'file';
}

function getMessageType(files: PendingFile[]): 'text' | 'image' | 'file' {
    if (files.length === 0) return 'text';
    return files.every((f) => f.type === 'image') ? 'image' : 'file';
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

let _idCounter = 0;
function nextId() { return `pf-${++_idCounter}`; }


function PaperclipIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
        </svg>
    );
}

function ArrowUpIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="19" x2="12" y2="5" />
            <polyline points="5 12 12 5 19 12" />
        </svg>
    );
}

function XSmallIcon() {
    return (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    );
}

function FileIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
        </svg>
    );
}

/* ──────────────────────────────────────────────────────────────
   Attachment preview strip
────────────────────────────────────────────────────────────── */

function AttachmentStrip({
    files,
    onRemove,
}: {
    files: PendingFile[];
    onRemove: (id: string) => void;
}) {
    if (files.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-2 px-4 pt-3 pb-0">
            {files.map((pf) => (
                <div
                    key={pf.id}
                    className="relative flex items-center gap-1.5 bg-dark-surface-3 border border-dark-border rounded-lg px-2 py-1.5 max-w-[140px]"
                >
                    {pf.previewUrl ? (
                        <img
                            src={pf.previewUrl}
                            alt={pf.file.name}
                            className="w-7 h-7 rounded object-cover flex-shrink-0"
                        />
                    ) : (
                        <span className="text-dark-secondary flex-shrink-0"><FileIcon /></span>
                    )}
                    <div className="min-w-0">
                        <p className="text-xsmall text-dark-primary truncate leading-tight">
                            {pf.file.name}
                        </p>
                        <p className="text-xsmall text-dark-secondary leading-tight">
                            {formatFileSize(pf.file.size)}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => onRemove(pf.id)}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-dark-surface-1 border border-dark-border rounded-full flex items-center justify-center text-dark-secondary hover:text-dark-primary transition-colors"
                    >
                        <XSmallIcon />
                    </button>
                </div>
            ))}
        </div>
    );
}

/* ──────────────────────────────────────────────────────────────
   Main component
────────────────────────────────────────────────────────────── */

export default function ChatComposer({
    projectSlug,
    roomId,
    onMessageSent,
    disabled = false,
}: Props) {
    const [body, setBody]                 = useState('');
    const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
    const [sending, setSending]           = useState(false);
    const [error, setError]               = useState<string | null>(null);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    /* ── Auto-resize textarea (1–4 lines) ── */
    const adjustHeight = () => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, 88)}px`;
    };

    /* ── Add files ── */
    const addFiles = useCallback((list: FileList | null) => {
        if (!list) return;
        const MAX_SIZE = 50 * 1024 * 1024;
        const toAdd: PendingFile[] = [];

        for (const file of Array.from(list)) {
            if (pendingFiles.length + toAdd.length >= 10) break;
            if (file.size > MAX_SIZE) {
                setError(`"${file.name}" melebihi batas 50 MB.`);
                continue;
            }
            const type = getAttachmentType(file);
            const pf: PendingFile = { id: nextId(), file, type };
            if (type === 'image') pf.previewUrl = URL.createObjectURL(file);
            toAdd.push(pf);
        }
        setPendingFiles((prev) => [...prev, ...toAdd]);
    }, [pendingFiles.length]);

    const removeFile = useCallback((id: string) => {
        setPendingFiles((prev) => {
            const pf = prev.find((f) => f.id === id);
            if (pf?.previewUrl) URL.revokeObjectURL(pf.previewUrl);
            return prev.filter((f) => f.id !== id);
        });
    }, []);

    /* ── Send ── */
    const send = useCallback(() => {
        const trimmed = body.trim();
        if (!trimmed && pendingFiles.length === 0) return;
        if (sending || disabled) return;

        setSending(true);
        setError(null);

        // Build payload as a flat object; Inertia serialises it as FormData
        // (forceFormData ensures file objects are transmitted as multipart).
        const payload: Record<string, string | File> = {
            type: pendingFiles.length > 0 ? getMessageType(pendingFiles) : 'text',
        };
        if (trimmed) payload['body'] = trimmed;
        pendingFiles.forEach((pf, i) => {
            payload[`attachments[${i}][file]`] = pf.file;
            payload[`attachments[${i}][type]`] = pf.type;
        });

        router.post(
            `/p/${projectSlug}/chat/rooms/${roomId}/messages`,
            payload,
            {
                forceFormData: true,
                preserveState: true,
                preserveScroll: true,
                // Include socket ID so Laravel's broadcast()->toOthers() can
                // exclude this sender from receiving their own broadcast.
                headers: { 'X-Socket-ID': echo.socketId() ?? '' },
                onSuccess: (page) => {
                    const newMessage = (page.props as { flash?: { chat?: { newMessage?: ChatMessage } } })
                        .flash?.chat?.newMessage;
                    if (newMessage) onMessageSent(newMessage);

                    setBody('');
                    setPendingFiles((prev) => {
                        prev.forEach((pf) => { if (pf.previewUrl) URL.revokeObjectURL(pf.previewUrl); });
                        return [];
                    });
                    if (fileInputRef.current) fileInputRef.current.value = '';
                    if (textareaRef.current) textareaRef.current.style.height = 'auto';
                    textareaRef.current?.focus();
                },
                onError: (errors) => {
                    setError(Object.values(errors)[0] ?? 'Gagal mengirim pesan.');
                },
                onFinish: () => setSending(false),
            },
        );
    }, [body, pendingFiles, sending, disabled, projectSlug, roomId, onMessageSent]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    };

    const isDisabled = disabled || sending;
    const canSend    = (body.trim().length > 0 || pendingFiles.length > 0) && !isDisabled;

    return (
        <div className="flex-shrink-0 px-3 pb-3 pt-1">
            {/* Attachment previews (above the bar) */}
            <AttachmentStrip files={pendingFiles} onRemove={removeFile} />

            {/* Error toast */}
            {error && (
                <div className="mb-2 px-3 py-1.5 rounded-lg bg-status-error/10 border border-status-error/30 flex items-center justify-between gap-2">
                    <p className="text-xsmall text-status-error">{error}</p>
                    <button type="button" onClick={() => setError(null)} className="text-status-error hover:opacity-70 flex-shrink-0">
                        <XSmallIcon />
                    </button>
                </div>
            )}

            {/* ── Unified pill bar ── */}
            <div className="flex items-end gap-2 rounded-xl bg-dark-surface-3 border border-dark-border px-3 py-2">
                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.7z"
                    onChange={(e) => addFiles(e.target.files)}
                />

                {/* Textarea — fills the bar */}
                <textarea
                    ref={textareaRef}
                    value={body}
                    onChange={(e) => { setBody(e.target.value); adjustHeight(); }}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message"
                    disabled={isDisabled}
                    rows={1}
                    className="flex-1 resize-none bg-transparent text-small text-dark-primary placeholder:text-dark-secondary focus:outline-none disabled:opacity-50 leading-[1.5] py-0.5"
                    style={{ minHeight: '22px', maxHeight: '88px' }}
                />

                {/* Right-side action buttons */}
                <div className="flex items-center gap-1 flex-shrink-0 pb-0.5">
                    {/* Attach */}
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isDisabled}
                        title="Attach file"
                        className="text-dark-secondary hover:text-dark-primary disabled:opacity-40 transition-colors p-1"
                    >
                        <PaperclipIcon />
                    </button>

                    {/* Send — circular with ↑ arrow */}
                    <button
                        type="button"
                        onClick={send}
                        disabled={!canSend}
                        title="Send"
                        className={[
                            'w-8 h-8 rounded-full flex items-center justify-center transition-all',
                            canSend
                                ? 'bg-accent-blue text-white hover:opacity-90 active:scale-95'
                                : 'bg-dark-surface-2 text-dark-secondary cursor-not-allowed',
                        ].join(' ')}
                    >
                        {sending ? (
                            <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                            </svg>
                        ) : (
                            <ArrowUpIcon />
                        )}
                    </button>
                </div>{/* end action buttons */}
            </div>{/* end pill bar */}
        </div>
    );
}
