import { usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import ChatComposer from '@/components/chat/ChatComposer';
import MessageList from '@/components/chat/MessageList';
import RoomAvatar from '@/components/chat/RoomAvatar';
import { useMessages } from '@/hooks/useMessages';
import { useTranslation } from '@/hooks/useTranslation';
import type { ChatMessage, ChatParticipant, ChatRoom } from '@/types/chat';
import { getRoomDisplayName } from '@/utils/chat';
import MoreIcon from '@public/icons/large/more.svg';
import CancelIcon from '@public/icons/small/cancel.svg';
import SearchIcon from '@public/icons/small/search.svg';

interface Props {
  room: ChatRoom | null;
  currentUser: ChatParticipant;
  onSenderClick?: (senderId: string) => void;
}

interface PageProps {
  project?: { project_id: string; project_name: string; project_slug: string };
  [key: string]: unknown;
}

const EmptyState = () => {
  const { t } = useTranslation();

  return (
    <div className="flex h-full flex-1 flex-col items-center justify-center gap-3 rounded-lg bg-dark-surface-2 select-none">
      <span className="text-dark-secondary opacity-30">
        <svg
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 6a3 3 0 0 1 3-3h2" />
          <path d="M11 3h2" />
          <path d="M16 3h2a3 3 0 0 1 3 3" />
          <path d="M21 10v2" />
          <path d="M21 15v1a3 3 0 0 1-3 3h-1" />
          <path d="M14 19h-2" />
          <path d="M9 19H8a3 3 0 0 1-3-3v-1" />
          <path d="M3 12v-2" />
          <path d="M3 17v2l3-2" />
        </svg>
      </span>
      <p className="text-normal font-medium text-dark-secondary opacity-40">
        {t('chat.sendAMessage')}
      </p>
    </div>
  );
};

const RoomHeader = ({
  room,
  currentUser,
  searchActive,
  onSearchToggle,
}: {
  room: ChatRoom;
  currentUser: ChatParticipant;
  searchActive: boolean;
  onSearchToggle: () => void;
}) => {
  const { t } = useTranslation();
  const displayName = getRoomDisplayName(room, currentUser, {
    group: t('chat.groupFallback'),
    directMessage: t('chat.directMessageFallback'),
  });
  const btnBase = 'p-2 rounded-lg transition-colors';
  const btnIdle =
    'text-dark-secondary hover:text-dark-primary hover:bg-dark-surface-2';

  return (
    <header className="flex shrink-0 items-center gap-3 rounded-t-lg border-b border-dark-border bg-dark-surface-3 px-5 py-2.75">
      <RoomAvatar room={room} currentUser={currentUser} size={32} />
      <p className="min-w-0 flex-1 truncate text-small font-semibold text-dark-primary">
        {displayName}
      </p>
      <div className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          onClick={onSearchToggle}
          title={t('chat.searchMessages')}
          className={[
            btnBase,
            searchActive ? 'bg-dark-surface-2 text-dark-primary' : btnIdle,
          ].join(' ')}
        >
          <SearchIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          title={t('chat.moreOptions')}
          className={`${btnBase} ${btnIdle}`}
        >
          <MoreIcon className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
};

const formatSearchTime = (iso: string): string =>
  new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const SearchOverlay = ({
  messages,
  onClose,
  onSelectResult,
}: {
  messages: ChatMessage[];
  onClose: () => void;
  onSelectResult: (msgId: string) => void;
}) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = query.trim()
    ? messages.filter(
        (m) =>
          !m.isDeleted && m.body?.toLowerCase().includes(query.toLowerCase()),
      )
    : [];

  return (
    <div className="absolute top-13.25 right-3 z-30 w-72 overflow-hidden rounded-xl border border-dark-border bg-dark-surface-2 shadow-2xl">
      <div className="flex items-center gap-2 border-b border-dark-border px-3 py-2">
        <span className="shrink-0 text-dark-secondary">
          <SearchIcon className="h-4 w-4" />
        </span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('chat.searchMessagesPlaceholder')}
          className="flex-1 bg-transparent text-small text-dark-primary placeholder:text-dark-secondary focus:outline-none"
        />
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 text-dark-secondary transition-colors hover:text-dark-primary"
        >
          <CancelIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="scrollbar-app max-h-72 overflow-y-auto">
        {query.trim() === '' && (
          <p className="px-4 py-5 text-center text-xsmall text-dark-secondary">
            {t('chat.startTypingToSearch')}
          </p>
        )}
        {query.trim() !== '' && results.length === 0 && (
          <p className="px-4 py-5 text-center text-xsmall text-dark-secondary">
            {t('chat.noMessagesFound')}
          </p>
        )}
        {results.map((msg) => (
          <button
            key={msg._id}
            type="button"
            onClick={() => onSelectResult(msg._id)}
            className="w-full border-b border-dark-border/40 px-3 py-2.5 text-left transition-colors last:border-0 hover:bg-dark-surface-3"
          >
            <p className="mb-0.5 truncate text-xsmall text-dark-secondary">
              {msg.sender?.name ?? t('common.unknown')} ·{' '}
              {formatSearchTime(msg.createdAt)}
            </p>
            <p className="truncate text-small text-dark-primary">{msg.body}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

const RoomView = ({
  room,
  currentUser,
  projectSlug,
  onSenderClick,
}: {
  room: ChatRoom;
  currentUser: ChatParticipant;
  projectSlug: string;
  onSenderClick?: (senderId: string) => void;
}) => {
  const { messages, hasMore, loading, initialLoading, loadMore, pushMessage } =
    useMessages(projectSlug, room.id);

  const [latestMsgId, setLatestMsgId] = useState<string | undefined>();
  const [showSearch, setShowSearch] = useState(false);

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
    <div className="relative flex h-full flex-1 flex-col overflow-hidden rounded-lg bg-dark-surface-2">
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
};

const ChatWindow = ({ room, currentUser, onSenderClick }: Props) => {
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
};

export default ChatWindow;
