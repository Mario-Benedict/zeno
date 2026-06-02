import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
} from 'react';
import MessageBubble from '@/components/chat/MessageBubble';
import type { ChatMessage, ChatParticipant } from '@/types/chat';

interface Props {
  messages: ChatMessage[];
  currentUser: ChatParticipant;
  hasMore: boolean;
  loading: boolean;
  initialLoading: boolean;
  onLoadMore: () => void;
  newMessageSignal?: string;
  onSenderClick?: (senderId: string) => void;
}

const isSameDay = (a: string, b: string): boolean => {
  const da = new Date(a);
  const db = new Date(b);

  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
};

const formatDateLabel = (iso: string): string => {
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
};

const FIVE_MINUTES = 5 * 60 * 1000;

const shouldShowHeader = (
  current: ChatMessage,
  previous: ChatMessage | null,
): boolean => {
  if (!previous) return true;
  if (String(current.senderId) !== String(previous.senderId)) return true;
  const diff =
    new Date(current.createdAt).getTime() -
    new Date(previous.createdAt).getTime();

  return Math.abs(diff) > FIVE_MINUTES;
};

const Spinner = () => (
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

const MessageList = ({
  messages,
  currentUser,
  hasMore,
  loading,
  initialLoading,
  onLoadMore,
  newMessageSignal,
  onSenderClick,
}: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const isFirstRenderRef = useRef(true);
  const isLoadingMoreRef = useRef(false);
  const savedScrollRef = useRef({ top: 0, height: 0 });

  const sorted = [...messages].reverse();

  const handleLoadMore = useCallback(() => {
    if (!containerRef.current || loading || !hasMore) return;
    savedScrollRef.current = {
      top: containerRef.current.scrollTop,
      height: containerRef.current.scrollHeight,
    };
    isLoadingMoreRef.current = true;
    onLoadMore();
  }, [loading, hasMore, onLoadMore]);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (isLoadingMoreRef.current) {
      const diff = el.scrollHeight - savedScrollRef.current.height;
      el.scrollTop = savedScrollRef.current.top + diff;
      isLoadingMoreRef.current = false;

      return;
    }

    if (isFirstRenderRef.current && messages.length > 0) {
      el.scrollTop = el.scrollHeight;
      isFirstRenderRef.current = false;
    }
  }, [messages]);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el || !newMessageSignal) return;

    const { scrollTop, scrollHeight, clientHeight } = el;
    const distFromBottom = scrollHeight - scrollTop - clientHeight;

    if (distFromBottom < 150) {
      el.scrollTop = scrollHeight;
    }
  }, [newMessageSignal]);

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
      className="flex-1 overflow-y-auto px-5 py-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-dark-surface-3 hover:[&::-webkit-scrollbar-thumb]:bg-dark-secondary [&::-webkit-scrollbar-track]:bg-transparent"
    >
      <div ref={topSentinelRef} className="h-px" />

      {loading && <Spinner />}

      {sorted.map((msg, i) => {
        const prev = i > 0 ? sorted[i - 1] : null;
        const showDateSep = !prev || !isSameDay(prev.createdAt, msg.createdAt);
        const showHeader = shouldShowHeader(msg, prev);

        return (
          <Fragment key={msg._id}>
            {showDateSep && (
              <div className="my-5 flex items-center gap-3">
                <hr className="flex-1 border-dark-border" />
                <span className="shrink-0 px-1 text-xsmall text-dark-secondary">
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
          </Fragment>
        );
      })}
    </div>
  );
};

export default MessageList;
