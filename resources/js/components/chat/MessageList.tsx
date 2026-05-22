import React, { useRef, useLayoutEffect, useEffect, useCallback } from 'react';
import type { ChatMessage, ChatParticipant } from '@/types/chat';
import MessageBubble from '@/components/chat/MessageBubble';

interface Props {
    messages: ChatMessage[];   // newest-first order (index 0 = latest)
    currentUser: ChatParticipant;
    hasMore: boolean;
    loading: boolean;
    initialLoading: boolean;
    onLoadMore: () => void;
    /** Called when a new message is added so we can auto-scroll. */
    newMessageSignal?: string;
    /** Group rooms: clicking sender name/avatar opens a DM. */
    onSenderClick?: (senderId: string) => void;
}

/* ──────────────────────────────────────────────────────────────
   Date separator helper
────────────────────────────────────────────────────────────── */

function isSameDay(a: string, b: string): boolean {
    const da = new Date(a);
    const db = new Date(b);
    return (
        da.getFullYear() === db.getFullYear() &&
        da.getMonth() === db.getMonth() &&
        da.getDate() === db.getDate()
    );
}

function formatDateLabel(iso: string): string {
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (isSameDay(iso, today.toISOString())) return 'Today';
    if (isSameDay(iso, yesterday.toISOString())) return 'Yesterday';

    return d.toLocaleDateString([], {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    });
}

/* ──────────────────────────────────────────────────────────────
   Grouping helper
   Two consecutive messages are "grouped" (no repeated header) when
   they share the same sender AND are within 5 minutes of each other.
────────────────────────────────────────────────────────────── */

const FIVE_MINUTES = 5 * 60 * 1000;

function shouldShowHeader(
    current: ChatMessage,
    previous: ChatMessage | null,
): boolean {
    if (!previous) return true;
    if (String(current.senderId) !== String(previous.senderId)) return true;
    const diff =
        new Date(current.createdAt).getTime() -
        new Date(previous.createdAt).getTime();
    return Math.abs(diff) > FIVE_MINUTES;
}

/* ──────────────────────────────────────────────────────────────
   Loading spinner
────────────────────────────────────────────────────────────── */

function Spinner() {
    return (
        <div className="flex justify-center py-3">
            <svg
                className="animate-spin text-dark-secondary"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
            >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
        </div>
    );
}

/* ──────────────────────────────────────────────────────────────
   Main component
────────────────────────────────────────────────────────────── */

export default function MessageList({
    messages,
    currentUser,
    hasMore,
    loading,
    initialLoading,
    onLoadMore,
    newMessageSignal,
    onSenderClick,
}: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const topSentinelRef = useRef<HTMLDivElement>(null);
    const isFirstRenderRef = useRef(true);
    const isLoadingMoreRef = useRef(false);
    const savedScrollRef = useRef({ top: 0, height: 0 });

    /* ── Sorted for display: oldest at top, newest at bottom ── */
    const sorted = [...messages].reverse();

    /* ── Capture scroll position before loading older messages ── */
    const handleLoadMore = useCallback(() => {
        if (!containerRef.current || loading || !hasMore) return;
        savedScrollRef.current = {
            top: containerRef.current.scrollTop,
            height: containerRef.current.scrollHeight,
        };
        isLoadingMoreRef.current = true;
        onLoadMore();
    }, [loading, hasMore, onLoadMore]);

    /* ── Scroll management after messages update ── */
    useLayoutEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        if (isLoadingMoreRef.current) {
            // Restore scroll position after prepending older messages
            const diff = el.scrollHeight - savedScrollRef.current.height;
            el.scrollTop = savedScrollRef.current.top + diff;
            isLoadingMoreRef.current = false;
            return;
        }

        if (isFirstRenderRef.current && messages.length > 0) {
            // Initial load: always scroll to bottom
            el.scrollTop = el.scrollHeight;
            isFirstRenderRef.current = false;
            return;
        }
    }, [messages]);

    /* ── Auto-scroll to bottom when current user sends a message ── */
    useLayoutEffect(() => {
        const el = containerRef.current;
        if (!el || !newMessageSignal) return;

        const { scrollTop, scrollHeight, clientHeight } = el;
        const distFromBottom = scrollHeight - scrollTop - clientHeight;

        // Only auto-scroll if already near the bottom (<150px away)
        if (distFromBottom < 150) {
            el.scrollTop = scrollHeight;
        }
    }, [newMessageSignal]);

    /* ── IntersectionObserver for top-sentinel → trigger loadMore ── */
    useEffect(() => {
        const sentinel = topSentinelRef.current;
        const container = containerRef.current;
        if (!sentinel || !container) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && hasMore && !loading) {
                    handleLoadMore();
                }
            },
            { root: container, threshold: 0 },
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasMore, loading, handleLoadMore]);

    /* ── Empty / loading states ── */
    if (initialLoading) {
        return (
            <div className="flex flex-1 items-center justify-center">
                <Spinner />
            </div>
        );
    }

    if (!initialLoading && messages.length === 0) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 select-none">
                <svg
                    width="36"
                    height="36"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="text-dark-secondary opacity-40"
                >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <p className="text-small text-dark-secondary opacity-50">
                    No messages yet. Say hello!
                </p>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-dark-border px-5 py-4"
        >
            {/* Top sentinel — triggers load more when scrolled into view */}
            <div ref={topSentinelRef} className="h-px" />

            {/* Loading older messages indicator */}
            {loading && <Spinner />}

            {/* Message list */}
            {sorted.map((msg, i) => {
                const prev        = i > 0 ? sorted[i - 1] : null;
                const showDateSep = !prev || !isSameDay(prev.createdAt, msg.createdAt);
                const showHeader  = shouldShowHeader(msg, prev);

                return (
                    <React.Fragment key={msg._id}>
                        {showDateSep && (
                            <div className="flex items-center gap-3 my-5">
                                <hr className="flex-1 border-dark-border" />
                                <span className="text-xsmall text-dark-secondary shrink-0 px-1">
                                    {formatDateLabel(msg.createdAt)}
                                </span>
                                <hr className="flex-1 border-dark-border" />
                            </div>
                        )}
                        <div data-msgid={msg._id}>
                            <MessageBubble
                                message={msg}
                                currentUser={currentUser}
                                showHeader={showHeader}
                                onSenderClick={onSenderClick}
                            />
                        </div>
                    </React.Fragment>
                );
            })}
        </div>
    );
}
