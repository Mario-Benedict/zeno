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

export const useMessages = (projectSlug: string, roomId: string) => {
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
  const [latestMessageId, setLatestMessageId] = useState<string | undefined>();

  const isLoadingMoreRef = useRef(false);

  const receiveMessage = useCallback(
    (message: ChatMessage) => {
      setLocalMessages((prev) => {
        if (prev.some((item) => item._id === message._id)) return prev;

        return [message, ...prev];
      });
      setLatestMessageId(message._id);

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

    router.get(
      chat.index.url({ accountIndex, project: projectSlug }),
      { room: roomId },
      {
        only: ['messages', 'nextCursor', 'hasMore'],
        preserveState: true,
        preserveScroll: true,
        onSuccess: () => refreshNotifications(),
        onFinish: () => setInitialLoading(false),
      },
    );
  }, [accountIndex, projectSlug, roomId]);

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

  const pushMessage = (message: ChatMessage) => {
    setLocalMessages((prev) => [message, ...prev]);
    setLatestMessageId(message._id);
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
    latestMessageId,
  };
};
