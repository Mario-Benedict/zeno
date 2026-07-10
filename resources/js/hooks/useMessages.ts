import { router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import echo from '@/echo';
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
        onFinish: () => setInitialLoading(false),
      },
    );

    const channel = echo.private(`chat.${roomId}`);
    channel.listen('.message.sent', (e: { message: ChatMessage }) => {
      setLocalMessages((prev) => {
        if (prev.some((m) => m._id === e.message._id)) return prev;

        return [e.message, ...prev];
      });
      setLatestMessageId(e.message._id);
    });

    return () => {
      echo.leave(`chat.${roomId}`);
    };
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
    latestMessageId,
  };
};
