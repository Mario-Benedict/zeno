import { useEffect, useRef, useState } from 'react';
import echo from '@/echo';
import { useProject } from '@/hooks/useProject';
import { useTranslation } from '@/hooks/useTranslation';
import { inertiaJson } from '@/lib/inertiaJson';
import chat from '@/routes/chat';
import type { ChatMessage, ChatParticipant, ChatRoom } from '@/types/chat';
import { getRoomDisplayName } from '@/utils/chat';
import BackIcon from '@public/icons/small/arrow_left.svg';

interface Props {
  room: ChatRoom;
  currentUser: ChatParticipant;
  onBack: () => void;
}

// Multiple ChatWidget instances (e.g. two chat widgets on the same
// dashboard) can subscribe to the same `chat.{roomId}` channel. Echo caches
// channels by name, so `echo.leave()` on one component's cleanup would tear
// down the shared channel out from under the other — real-time updates would
// silently stop until a refresh re-subscribed it. Ref-count subscribers per
// channel and only actually leave once the last one unmounts.
const channelRefCounts = new Map<string, number>();

const subscribeToRoomMessages = (
  roomId: string,
  onMessage: (message: ChatMessage) => void,
) => {
  const channelName = `chat.${roomId}`;
  const channel = echo.private(channelName);
  const listener = (e: { message: ChatMessage }) => onMessage(e.message);
  channel.listen('.message.sent', listener);

  channelRefCounts.set(
    channelName,
    (channelRefCounts.get(channelName) ?? 0) + 1,
  );

  return () => {
    channel.stopListening('.message.sent', listener);

    const remaining = (channelRefCounts.get(channelName) ?? 1) - 1;
    if (remaining <= 0) {
      channelRefCounts.delete(channelName);
      echo.leave(channelName);
    } else {
      channelRefCounts.set(channelName, remaining);
    }
  };
};

const SendIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="19" x2="12" y2="5" />
    <polyline points="5 12 12 5 19 12" />
  </svg>
);

export const ChatWidgetConversation = ({
  room,
  currentUser,
  onBack,
}: Props) => {
  const { project, accountIndex } = useProject();
  const { t } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    // Reset the loading flag for the newly selected room before fetching.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);

    inertiaJson<{ messages: ChatMessage[] }>(
      'get',
      chat.rooms.messages.index.url({
        accountIndex,
        project: project.project_slug,
        room: room.id,
      }),
    )
      .then((data: { messages: ChatMessage[] }) => {
        if (!cancelled) setMessages(data.messages);
      })
      .catch(() => console.error('Failed to load messages'))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    const unsubscribe = subscribeToRoomMessages(room.id, (message) => {
      setMessages((prev) =>
        prev.some((m) => m._id === message._id) ? prev : [message, ...prev],
      );
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [accountIndex, project.project_slug, room.id]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  const handleSend = async () => {
    const trimmed = body.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setBody('');

    try {
      // Deliberately NOT sending X-Socket-ID here. That would make the
      // backend's broadcast(...)->toOthers() exclude this browser tab's whole
      // websocket connection, and sibling dashboard widgets share that one
      // connection. Every widget receives the socket event; _id dedupe keeps
      // it from rendering twice.
      const data = await inertiaJson<{ message: ChatMessage }>(
        'post',
        chat.rooms.messages.store.url({
          accountIndex,
          project: project.project_slug,
          room: room.id,
        }),
        {
          data: { type: 'text', body: trimmed },
        },
      );
      setMessages((prev) =>
        prev.some((m) => m._id === data.message._id)
          ? prev
          : [data.message, ...prev],
      );
    } catch {
      console.error(t('chat.failedToSendMessage'));
      setBody(trimmed);
    } finally {
      setSending(false);
    }
  };

  const displayName = getRoomDisplayName(room, currentUser, {
    group: t('chat.groupFallback'),
    directMessage: t('chat.directMessageFallback'),
  });
  // Backend returns newest-first (cursor pagination order) — reverse to render oldest→newest.
  const ordered = [...messages].reverse();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-2 pt-3 pr-10 pb-2 pl-3">
        <button
          type="button"
          onClick={onBack}
          aria-label={t('dashboard.backToChats')}
          className="rounded-lg p-1 text-white/50 transition hover:bg-white/10 hover:text-white"
        >
          <BackIcon className="h-4 w-4" />
        </button>
        <p className="min-w-0 flex-1 truncate text-small font-semibold text-dark-primary">
          {displayName}
        </p>
      </div>

      <div
        ref={listRef}
        className="scrollbar-app flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-3 pb-2"
      >
        {loading ? (
          <p className="py-6 text-center text-xsmall text-white/30">
            {t('dashboard.loadingMessages')}
          </p>
        ) : ordered.length === 0 ? (
          <p className="py-6 text-center text-xsmall text-white/30">
            {t('dashboard.noMessagesYet')}
          </p>
        ) : (
          ordered.map((msg) => {
            const isMine = msg.senderId === currentUser.id;

            return (
              <div
                key={msg._id}
                className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
              >
                {!isMine && room.type === 'group' && (
                  <span className="mb-0.5 px-1 text-micro text-white/30">
                    {msg.sender?.name ?? t('dashboard.unknownSender')}
                  </span>
                )}
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-1.5 text-xsmall ${
                    isMine
                      ? 'bg-accent-blue text-white'
                      : 'bg-dark-surface-3 text-white/90'
                  }`}
                >
                  {msg.isDeleted ? (
                    <span className="text-white/50 italic">
                      {t('dashboard.messageDeleted')}
                    </span>
                  ) : msg.type === 'text' ? (
                    msg.body
                  ) : (
                    `📎 ${
                      msg.type === 'image'
                        ? t('dashboard.attachmentImage')
                        : t('dashboard.attachmentFile')
                    }`
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2 px-3 pt-1 pb-3">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void handleSend();
            }
          }}
          placeholder={t('dashboard.messagePlaceholder')}
          className="min-w-0 flex-1 rounded-full bg-dark-surface-3 px-3 py-1.5 text-xsmall text-white placeholder-white/30 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => void handleSend()}
          disabled={!body.trim() || sending}
          aria-label={t('dashboard.sendMessage')}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-blue text-white transition disabled:opacity-30"
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
};
