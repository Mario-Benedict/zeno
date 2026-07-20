import { router, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { inertiaJson } from '@/lib/inertiaJson';
import { refreshNotifications } from '@/lib/notificationEvents';
import chat from '@/routes/chat';
import type { ChatMessage } from '@/types/chat';

interface ChatPageProps {
  messages?: ChatMessage[];
  nextCursor?: string | null;
  hasMore?: boolean;
  [key: string]: unknown;
}

/**
 * `force: true` means the message list should always scroll to bottom
 * (the current user just sent this themselves) — `force: false` means it
 * should only scroll if the user was already near the bottom (a message
 * arrived from someone else while they may be reading older history).
 */
export interface ScrollSignal {
  id: string;
  force: boolean;
}

export const useMessages = (
  projectSlug: string,
  roomId: string,
  targetMessageId?: string | null,
) => {
  const {
    messages: serverMessages,
    nextCursor: serverNextCursor,
    hasMore: serverHasMore,
    account,
  } = usePage<ChatPageProps>().props;
  const accountIndex = account.index;

  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [scrollSignal, setScrollSignal] = useState<ScrollSignal | undefined>();

  const isLoadingMoreRef = useRef(false);

  const receiveMessage = useCallback(
    (message: ChatMessage) => {
      setLocalMessages((prev) => {
        if (prev.some((item) => item._id === message._id)) return prev;

        return [message, ...prev];
      });
      setScrollSignal({ id: message._id, force: false });

      void inertiaJson(
        'get',
        chat.rooms.messages.index.url(
          {
            accountIndex,
            project: projectSlug,
            room: roomId,
          },
          { query: { limit: 1 } },
        ),
      )
        .then(refreshNotifications)
        .catch((error: unknown) => {
          console.error('Failed to mark the incoming message as read', error);
        });
    },
    [accountIndex, projectSlug, roomId],
  );

  useEffect(() => {
    if (!roomId) return;

    isLoadingMoreRef.current = false;
    // A second global-search result can target a different message in the
    // room while this page component stays mounted.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInitialLoading(true);

    router.get(
      chat.index.url({ accountIndex, project: projectSlug }),
      {
        room: roomId,
        ...(targetMessageId ? { message: targetMessageId } : {}),
      },
      {
        only: ['messages', 'nextCursor', 'hasMore'],
        preserveState: true,
        preserveScroll: true,
        onSuccess: () => refreshNotifications(),
        onFinish: () => setInitialLoading(false),
      },
    );
  }, [accountIndex, projectSlug, roomId, targetMessageId]);

  useEffect(() => {
    if (serverMessages === undefined) return;

    if (isLoadingMoreRef.current) {
      setLocalMessages((prev) => [...prev, ...serverMessages]);
      setLoadingMore(false);
    } else {
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
      chat.index.url({ accountIndex, project: projectSlug }),
      { room: roomId, before: cursor },
      {
        only: ['messages', 'nextCursor', 'hasMore'],
        preserveState: true,
        preserveScroll: true,
      },
    );
  };

  /** Adds a message immediately and force-scrolls — the current user's own optimistic send. */
  const pushMessage = (message: ChatMessage) => {
    setLocalMessages((prev) => [message, ...prev]);
    setScrollSignal({ id: message._id, force: true });
  };

  /** Replaces an optimistic message with the server-confirmed one once the send succeeds. */
  const confirmMessage = (tempId: string, message: ChatMessage) => {
    setLocalMessages((prev) =>
      prev.map((m) => (m._id === tempId ? message : m)),
    );
  };

  /** Marks an optimistic message as failed instead of silently dropping it. */
  const failMessage = (tempId: string) => {
    setLocalMessages((prev) =>
      prev.map((m) =>
        m._id === tempId ? { ...m, pending: false, failed: true } : m,
      ),
    );
  };

  return {
    messages: localMessages,
    nextCursor: serverNextCursor ?? null,
    hasMore: serverHasMore ?? false,
    loading: loadingMore,
    initialLoading,
    loadMore,
    pushMessage,
    receiveMessage,
    confirmMessage,
    failMessage,
    scrollSignal,
  };
};
