import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
} from 'react';
import MessageBubble from '@/components/chat/MessageBubble';
import type { ScrollSignal } from '@/hooks/useMessages';
import { useTranslation } from '@/hooks/useTranslation';
import type { ChatMessage, ChatParticipant } from '@/types/chat';
import MessageIcon from '@public/icons/small/message.svg';
import SpinnerIcon from '@public/icons/small/spinner.svg';

interface Props {
  messages: ChatMessage[];
  currentUser: ChatParticipant;
  hasMore: boolean;
  loading: boolean;
  initialLoading: boolean;
  onLoadMore: () => void;
  scrollSignal?: ScrollSignal;
  targetMessageId?: string | null;
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

const formatDateLabel = (
  iso: string,
  labels: { today: string; yesterday: string },
): string => {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (isSameDay(iso, today.toISOString())) return labels.today;
  if (isSameDay(iso, yesterday.toISOString())) return labels.yesterday;

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

const MessageList = ({
  messages,
  currentUser,
  hasMore,
  loading,
  initialLoading,
  onLoadMore,
  scrollSignal,
  targetMessageId,
  onSenderClick,
}: Props) => {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const isFirstRenderRef = useRef(true);
  const isLoadingMoreRef = useRef(false);
  const focusedTargetRef = useRef<string | null>(null);
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

    if (targetMessageId && focusedTargetRef.current !== targetMessageId) {
      const target = el.querySelector<HTMLElement>(
        `[data-msgid="${targetMessageId}"]`,
      );
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        focusedTargetRef.current = targetMessageId;
        isFirstRenderRef.current = false;

        return;
      }
    }

    if (isFirstRenderRef.current && messages.length > 0) {
      el.scrollTop = el.scrollHeight;
      isFirstRenderRef.current = false;
    }
  }, [messages, targetMessageId]);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el || !scrollSignal) return;

    const { scrollTop, scrollHeight, clientHeight } = el;
    const distFromBottom = scrollHeight - scrollTop - clientHeight;

    if (scrollSignal.force || distFromBottom < 150) {
      el.scrollTop = scrollHeight;
    }
  }, [scrollSignal]);

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
        <SpinnerIcon className="animate-spin text-dark-secondary" />
      </div>
    );
  }

  if (!initialLoading && messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 select-none">
        <MessageIcon className="text-dark-secondary opacity-40" />
        <p className="text-small text-dark-secondary opacity-50">
          {t('chat.noMessagesYet')}
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="scrollbar-app flex-1 overflow-y-auto px-5 py-4"
    >
      <div ref={topSentinelRef} className="h-px" />

      {loading && (
        <div className="flex justify-center py-3">
          <SpinnerIcon className="animate-spin text-dark-secondary" />
        </div>
      )}

      {sorted.map((msg, i) => {
        const prev = i > 0 ? sorted[i - 1] : null;
        const showDateSep = !prev || !isSameDay(prev.createdAt, msg.createdAt);
        const showHeader = shouldShowHeader(msg, prev);
        const isTarget = msg._id === targetMessageId;

        return (
          <Fragment key={msg._id}>
            {showDateSep && (
              <div className="my-5 flex items-center gap-3">
                <hr className="flex-1 border-dark-border" />
                <span className="shrink-0 px-1 text-xsmall text-dark-secondary">
                  {formatDateLabel(msg.createdAt, {
                    today: t('chat.today'),
                    yesterday: t('chat.yesterday'),
                  })}
                </span>
                <hr className="flex-1 border-dark-border" />
              </div>
            )}
            <div
              data-msgid={msg._id}
              aria-current={isTarget ? 'true' : undefined}
              className={
                isTarget
                  ? 'rounded-lg bg-accent-blue/10 ring-2 ring-accent-blue/70 ring-offset-4 ring-offset-dark-surface-2'
                  : undefined
              }
            >
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
