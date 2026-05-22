import React from 'react';
import type { ChatMessage, ChatParticipant, MessageAttachment } from '@/types/chat';

interface Props {
    message: ChatMessage;
    currentUser: ChatParticipant;
    /** Show sender name + avatar (first message in a consecutive group). */
    showHeader: boolean;
    /**
     * If provided (group rooms only), clicking a sender name/avatar calls this
     * with the sender's userId so the parent can open a DM.
     */
    onSenderClick?: (senderId: string) => void;
}

/* ──────────────────────────────────────────────────────────────
   Helpers
────────────────────────────────────────────────────────────── */

function formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function initials(name: string): string {
    return name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase();
}

/**
 * Deterministic accent color for sender names.
 * Same name always gets the same color (Discord-style).
 */
const SENDER_COLOR_CLASSES = [
    'text-accent-purple-light',
    'text-accent-cyan-light',
    'text-accent-green-light',
    'text-accent-orange-light',
    'text-accent-pink-light',
    'text-accent-blue-light',
    'text-accent-lime-light',
] as const;

function senderNameColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return SENDER_COLOR_CLASSES[Math.abs(hash) % SENDER_COLOR_CLASSES.length];
}

/* ──────────────────────────────────────────────────────────────
   Sender Avatar
────────────────────────────────────────────────────────────── */

const AVATAR_BG_CLASSES = [
    'bg-accent-purple',
    'bg-accent-cyan',
    'bg-accent-green',
    'bg-accent-orange',
    'bg-accent-pink',
    'bg-accent-blue',
    'bg-accent-lime',
] as const;

function avatarBgColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_BG_CLASSES[Math.abs(hash) % AVATAR_BG_CLASSES.length];
}

function SenderAvatar({ participant }: { participant: ChatParticipant | undefined }) {
    const SIZE = 28;
    const style = { width: SIZE, height: SIZE, minWidth: SIZE };

    if (!participant) {
        return (
            <span
                style={style}
                className="inline-flex items-center justify-center rounded-full bg-dark-surface-3 text-dark-secondary text-xsmall font-semibold"
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

    const bg = avatarBgColor(participant.name);
    return (
        <span
            style={style}
            className={`inline-flex items-center justify-center rounded-full ${bg} text-white text-xsmall font-semibold`}
        >
            {initials(participant.name)}
        </span>
    );
}

/* ──────────────────────────────────────────────────────────────
   Attachment renderers
────────────────────────────────────────────────────────────── */

function ImageAttachment({ att }: { att: MessageAttachment }) {
    return (
        <a
            href={att.url ?? att.path}
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-1.5"
        >
            <img
                src={att.url ?? att.path}
                alt={att.fileName}
                className="max-w-[240px] max-h-[180px] rounded-lg object-cover border border-dark-border hover:opacity-90 transition-opacity"
            />
        </a>
    );
}

function FileAttachment({ att }: { att: MessageAttachment }) {
    // Prefer the server-resolved URL; fall back to an absolute root-relative path
    // so the correct host/port is always used even if att.url is missing.
    const href = att.url ?? `/storage/${att.path}`;

    return (
        <a
            href={href}
            download={att.fileName}
            className="flex items-center gap-2.5 mt-1.5 p-2.5 rounded-lg bg-dark-surface-1 border border-dark-border hover:border-dark-border-focus transition-colors max-w-[240px]"
        >
            <span className="flex-shrink-0 text-dark-secondary">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                </svg>
            </span>
            <div className="min-w-0 flex-1">
                <p className="truncate text-xsmall font-medium text-dark-primary">{att.fileName}</p>
                <p className="text-xsmall text-dark-secondary">{formatFileSize(att.size)}</p>
            </div>
            <span className="flex-shrink-0 text-dark-secondary">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
            </span>
        </a>
    );
}

/* ──────────────────────────────────────────────────────────────
   Main component
────────────────────────────────────────────────────────────── */

export default function MessageBubble({ message, currentUser, showHeader, onSenderClick }: Props) {
    const isOwn     = String(message.senderId) === String(currentUser.id);
    const sender    = message.sender;
    const isDeleted = message.isDeleted ?? false;

    const hasAttachments = message.attachments.length > 0;
    const hasText        = !isDeleted && message.body?.trim().length > 0;

    /* ── Own message (right-aligned) ── */
    if (isOwn) {
        return (
            <div className={['flex justify-end', showHeader ? 'mt-4' : 'mt-0.5'].join(' ')}>
                <div className="max-w-[62%]">
                    {/* Time — shown above the bubble on first of a group */}
                    {showHeader && (
                        <p className="text-xsmall text-dark-secondary text-right mb-1 pr-1">
                            {formatTime(message.createdAt)}
                        </p>
                    )}

                    {isDeleted ? (
                        <p className="text-small italic text-dark-secondary text-right pr-1">
                            This message was deleted.
                        </p>
                    ) : (
                        <div className="bg-dark-surface-3 rounded-2xl rounded-br-sm px-3.5 py-2">
                            {hasText && (
                                <p className="text-small text-dark-primary whitespace-pre-wrap break-words">
                                    {message.body}
                                </p>
                            )}
                            {hasAttachments && (
                                <div className="flex flex-col">
                                    {message.attachments.map((att) =>
                                        att.type === 'image'
                                            ? <ImageAttachment key={att.id} att={att} />
                                            : <FileAttachment   key={att.id} att={att} />,
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    /* ── Other user's message (left-aligned, bubble) ── */
    const nameColorClass = senderNameColor(sender?.name ?? '');
    const canClickSender = !!onSenderClick && String(message.senderId) !== String(currentUser.id);

    const handleSenderClick = () => {
        if (canClickSender) onSenderClick!(String(message.senderId));
    };

    return (
        <div className={['flex items-start gap-2.5', showHeader ? 'mt-4' : 'mt-0.5'].join(' ')}>
            {/* Avatar column — always 28px wide to keep text aligned */}
            <div className="w-7 flex-shrink-0 mt-0.5">
                {showHeader && (
                    canClickSender ? (
                        <button
                            type="button"
                            onClick={handleSenderClick}
                            className="hover:opacity-75 transition-opacity"
                            title={`Message ${sender?.name}`}
                        >
                            <SenderAvatar participant={sender} />
                        </button>
                    ) : (
                        <SenderAvatar participant={sender} />
                    )
                )}
            </div>

            {/* Message content */}
            <div className="max-w-[62%]">
                {/* Header: name + time */}
                {showHeader && (
                    <div className="flex items-baseline gap-2 mb-1">
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

                {/* Bubble */}
                {isDeleted ? (
                    <p className="text-small italic text-dark-secondary pl-1">
                        This message was deleted.
                    </p>
                ) : (
                    <div className="bg-dark-surface-3 rounded-2xl rounded-bl-sm px-3.5 py-2 inline-block max-w-full">
                        {hasText && (
                            <p className="text-small text-dark-primary whitespace-pre-wrap break-words">
                                {message.body}
                            </p>
                        )}
                        {hasAttachments && (
                            <div className="flex flex-col">
                                {message.attachments.map((att) =>
                                    att.type === 'image'
                                        ? <ImageAttachment key={att.id} att={att} />
                                        : <FileAttachment  key={att.id} att={att} />,
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
