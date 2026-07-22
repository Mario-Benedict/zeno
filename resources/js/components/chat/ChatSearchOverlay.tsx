import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import type { ChatMessage } from '@/types/chat';
import CancelIcon from '@public/icons/small/cancel.svg';
import SearchIcon from '@public/icons/small/search.svg';

interface Props {
  messages: ChatMessage[];
  onClose: () => void;
  onSelectResult: (messageId: string) => void;
}

const formatSearchTime = (iso: string): string =>
  new Date(iso).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

const ChatSearchOverlay = ({ messages, onClose, onSelectResult }: Props) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = query.trim()
    ? messages.filter(
        (message) =>
          !message.isDeleted &&
          message.body?.toLowerCase().includes(query.toLowerCase()),
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
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('chat.searchMessagesPlaceholder')}
          className="flex-1 bg-transparent text-small text-dark-primary placeholder:text-dark-secondary focus:outline-none"
        />
        <button
          type="button"
          onClick={onClose}
          aria-label={t('common.close')}
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
        {results.map((message) => (
          <button
            key={message._id}
            type="button"
            onClick={() => onSelectResult(message._id)}
            className="w-full border-b border-dark-border/40 px-3 py-2.5 text-left transition-colors last:border-0 hover:bg-dark-surface-3"
          >
            <p className="mb-0.5 truncate text-xsmall text-dark-secondary">
              {message.sender?.name ?? t('common.unknown')} ·{' '}
              {formatSearchTime(message.createdAt)}
            </p>
            <p className="truncate text-small text-dark-primary">
              {message.body}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ChatSearchOverlay;
