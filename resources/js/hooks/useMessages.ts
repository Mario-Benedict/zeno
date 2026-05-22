import { router, usePage } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import type { ChatMessage } from '@/types/chat';
import echo from '@/echo';

interface ChatPageProps {
    // Optional props — only present after an explicit partial reload.
    messages?: ChatMessage[];
    nextCursor?: string | null;
    hasMore?: boolean;
    [key: string]: unknown;
}

/**
 * useMessages
 * ------------
 * Manages cursor-paginated chat messages using Inertia partial reloads.
 *
 * - Room change  → router.get() with only:['messages','nextCursor','hasMore']
 * - Load more    → same, with `before` cursor param appended
 * - Messages are accumulated locally; server only sends one page at a time.
 *
 * @param projectSlug  URL slug of the project
 * @param roomId       UUID of the chat room
 */
export function useMessages(projectSlug: string, roomId: string) {
    const { messages: serverMessages, nextCursor: serverNextCursor, hasMore: serverHasMore } =
        usePage<ChatPageProps>().props;

    const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
    const [initialLoading, setInitialLoading]   = useState(false);
    const [loadingMore, setLoadingMore]         = useState(false);

    const isLoadingMoreRef = useRef(false);

    // ── Room change: reset state, fetch first page, subscribe to WebSocket ──
    useEffect(() => {
        if (!roomId) return;

        setLocalMessages([]);
        setInitialLoading(true);
        isLoadingMoreRef.current = false;

        router.get(
            `/p/${projectSlug}/chat`,
            { room: roomId },
            {
                only: ['messages', 'nextCursor', 'hasMore'],
                preserveState: true,
                preserveScroll: true,
                onFinish: () => setInitialLoading(false),
            },
        );

        // Subscribe to private channel for this room.
        // toOthers() on the server means only OTHER users receive the broadcast;
        // the sender's message comes through the Inertia flash prop instead.
        const channel = echo.private(`chat.${roomId}`);
        channel.listen('.message.sent', (e: { message: ChatMessage }) => {
            setLocalMessages((prev) => {
                // Guard: skip if already present (dedup safety net)
                if (prev.some((m) => m._id === e.message._id)) return prev;
                return [e.message, ...prev];
            });
        });

        return () => {
            echo.leave(`chat.${roomId}`);
        };
    }, [roomId]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Merge server messages into local state when they arrive ──
    useEffect(() => {
        if (serverMessages === undefined) return;

        if (isLoadingMoreRef.current) {
            // Append older messages (user scrolled up)
            setLocalMessages((prev) => [...prev, ...serverMessages]);
            setLoadingMore(false);
        } else {
            // Room switched: replace entire list
            setLocalMessages(serverMessages);
        }
        isLoadingMoreRef.current = false;
    }, [serverMessages]);

    const loadMore = () => {
        const cursor = serverNextCursor;
        if (!serverHasMore || !cursor || loadingMore || initialLoading) return;

        isLoadingMoreRef.current = true;
        setLoadingMore(true);

        router.get(
            `/p/${projectSlug}/chat`,
            { room: roomId, before: cursor },
            {
                only: ['messages', 'nextCursor', 'hasMore'],
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    /** Prepend a freshly-sent message to the top of the list (newest-first). */
    const pushMessage = (message: ChatMessage) => {
        setLocalMessages((prev) => [message, ...prev]);
    };

    return {
        messages: localMessages,
        nextCursor: serverNextCursor ?? null,
        hasMore: serverHasMore ?? false,
        loading: loadingMore,
        initialLoading,
        loadMore,
        pushMessage,
    };
}
