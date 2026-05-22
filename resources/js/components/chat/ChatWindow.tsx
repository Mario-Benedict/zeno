import React, { useState, useRef, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import type { ChatRoom, ChatParticipant, ChatMessage } from '@/types/chat';
import { useMessages } from '@/hooks/useMessages';
import MessageList from '@/components/chat/MessageList';
import ChatComposer from '@/components/chat/ChatComposer';
import RoomAvatar from '@/components/chat/RoomAvatar';
import { getRoomDisplayName } from '@/components/chat/ChatSidebar';

interface Props {
    room: ChatRoom | null;
    currentUser: ChatParticipant;
    /** Called when user taps a sender in a group chat to open a DM. */
    onSenderClick?: (senderId: string) => void;
}

interface PageProps {
    project?: { project_id: string; project_name: string; project_slug: string };
    [key: string]: unknown;
}

/* ──────────────────────────────────────────────────────────────
   Icons
────────────────────────────────────────────────────────────── */

function SearchIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
    );
}

function DotsVerticalIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="5"  r="1" fill="currentColor" />
            <circle cx="12" cy="12" r="1" fill="currentColor" />
            <circle cx="12" cy="19" r="1" fill="currentColor" />
        </svg>
    );
}

function XIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    );
}

function MessageIcon() {
    return (
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6a3 3 0 0 1 3-3h2" /><path d="M11 3h2" /><path d="M16 3h2a3 3 0 0 1 3 3" />
            <path d="M21 10v2" /><path d="M21 15v1a3 3 0 0 1-3 3h-1" /><path d="M14 19h-2" />
            <path d="M9 19H8a3 3 0 0 1-3-3v-1" /><path d="M3 12v-2" /><path d="M3 17v2l3-2" />
        </svg>
    );
}

/* ──────────────────────────────────────────────────────────────
   Empty state
────────────────────────────────────────────────────────────── */

function EmptyState() {
    return (
        <div className="flex flex-1 h-full flex-col items-center justify-center gap-3 bg-dark-surface-2 rounded-lg select-none">
            <span className="text-dark-secondary opacity-30"><MessageIcon /></span>
            <p className="text-normal font-medium text-dark-secondary opacity-40">Send a message</p>
        </div>
    );
}

/* ──────────────────────────────────────────────────────────────
   Room header  (bg-dark-surface-3)
────────────────────────────────────────────────────────────── */

function RoomHeader({
    room, currentUser, searchActive, onSearchToggle,
}: {
    room: ChatRoom; currentUser: ChatParticipant;
    searchActive: boolean; onSearchToggle: () => void;
}) {
    const displayName = getRoomDisplayName(room, currentUser);
    const btnBase = 'p-2 rounded-lg transition-colors';
    const btnIdle = 'text-dark-secondary hover:text-dark-primary hover:bg-dark-surface-2';

    return (
        <header className="flex items-center gap-3 bg-dark-surface-3 border-b border-dark-border px-5 py-[11px] flex-shrink-0 rounded-t-lg">
            <RoomAvatar room={room} currentUser={currentUser} size={32} />
            <p className="flex-1 text-small font-semibold text-dark-primary truncate min-w-0">
                {displayName}
            </p>
            <div className="flex items-center gap-0.5 flex-shrink-0">
                <button
                    type="button" onClick={onSearchToggle} title="Search messages"
                    className={[btnBase, searchActive ? 'text-dark-primary bg-dark-surface-2' : btnIdle].join(' ')}
                >
                    <SearchIcon />
                </button>
                <button type="button" title="More options" className={`${btnBase} ${btnIdle}`}>
                    <DotsVerticalIcon />
                </button>
            </div>
        </header>
    );
}

/* ──────────────────────────────────────────────────────────────
   Search overlay
────────────────────────────────────────────────────────────── */

function formatSearchTime(iso: string): string {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function SearchOverlay({
    messages, onClose, onSelectResult,
}: {
    messages: ChatMessage[];
    onClose: () => void;
    onSelectResult: (msgId: string) => void;
}) {
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { inputRef.current?.focus(); }, []);

    const results = query.trim()
        ? messages.filter((m) => !m.isDeleted && m.body?.toLowerCase().includes(query.toLowerCase()))
        : [];

    return (
        <div className="absolute top-[53px] right-3 z-30 w-72 bg-dark-surface-2 border border-dark-border rounded-xl shadow-2xl overflow-hidden">
            {/* Input row */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-dark-border">
                <span className="text-dark-secondary shrink-0"><SearchIcon /></span>
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search messages…"
                    className="flex-1 bg-transparent text-small text-dark-primary placeholder:text-dark-secondary focus:outline-none"
                />
                <button type="button" onClick={onClose} className="text-dark-secondary hover:text-dark-primary transition-colors shrink-0">
                    <XIcon />
                </button>
            </div>

            {/* Results */}
            <div className="max-h-72 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-dark-border">
                {query.trim() === '' && (
                    <p className="px-4 py-5 text-center text-xsmall text-dark-secondary">Start typing to search…</p>
                )}
                {query.trim() !== '' && results.length === 0 && (
                    <p className="px-4 py-5 text-center text-xsmall text-dark-secondary">No messages found</p>
                )}
                {results.map((msg) => (
                    <button
                        key={msg._id} type="button"
                        onClick={() => onSelectResult(msg._id)}
                        className="w-full px-3 py-2.5 text-left hover:bg-dark-surface-3 border-b border-dark-border/40 transition-colors last:border-0"
                    >
                        <p className="text-xsmall text-dark-secondary truncate mb-0.5">
                            {msg.sender?.name ?? 'Unknown'} · {formatSearchTime(msg.createdAt)}
                        </p>
                        <p className="text-small text-dark-primary truncate">{msg.body}</p>
                    </button>
                ))}
            </div>
        </div>
    );
}

/* ──────────────────────────────────────────────────────────────
   Active room view  (keyed by room.id → remounts on room switch)
────────────────────────────────────────────────────────────── */

function RoomView({
    room, currentUser, projectSlug, onSenderClick,
}: {
    room: ChatRoom; currentUser: ChatParticipant;
    projectSlug: string; onSenderClick?: (senderId: string) => void;
}) {
    const { messages, hasMore, loading, initialLoading, loadMore, pushMessage } =
        useMessages(projectSlug, room.id);

    const [latestMsgId, setLatestMsgId] = useState<string | undefined>();
    const [showSearch, setShowSearch]   = useState(false);

    const handleMessageSent = (message: ChatMessage) => {
        pushMessage(message);
        setLatestMsgId(message._id);
    };

    const scrollToMessage = (msgId: string) => {
        setShowSearch(false);
        requestAnimationFrame(() => {
            const el = document.querySelector(`[data-msgid="${msgId}"]`);
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    };

    return (
        <div className="relative flex flex-1 h-full flex-col bg-dark-surface-2 overflow-hidden rounded-lg">
            <RoomHeader
                room={room}
                currentUser={currentUser}
                searchActive={showSearch}
                onSearchToggle={() => setShowSearch((v) => !v)}
            />

            {showSearch && (
                <SearchOverlay
                    messages={messages}
                    onClose={() => setShowSearch(false)}
                    onSelectResult={scrollToMessage}
                />
            )}

            <MessageList
                messages={messages}
                currentUser={currentUser}
                hasMore={hasMore}
                loading={loading}
                initialLoading={initialLoading}
                onLoadMore={loadMore}
                newMessageSignal={latestMsgId}
                onSenderClick={room.type === 'group' ? onSenderClick : undefined}
            />

            <ChatComposer
                projectSlug={projectSlug}
                roomId={room.id}
                onMessageSent={handleMessageSent}
            />
        </div>
    );
}

/* ──────────────────────────────────────────────────────────────
   Exported component
────────────────────────────────────────────────────────────── */

export default function ChatWindow({ room, currentUser, onSenderClick }: Props) {
    const { project } = usePage<PageProps>().props;
    const projectSlug = project?.project_slug ?? '';

    if (!room) return <EmptyState />;

    return (
        <RoomView
            key={room.id}
            room={room}
            currentUser={currentUser}
            projectSlug={projectSlug}
            onSenderClick={onSenderClick}
        />
    );
}
