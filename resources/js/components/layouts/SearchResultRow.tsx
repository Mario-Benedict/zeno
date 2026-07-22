import { Link } from '@inertiajs/react';
import type { SVGProps } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import type { TranslationKey } from '@/i18n/dictionary';
import type { ProjectSearchKind, ProjectSearchResult } from '@/types/search';
import BoardIcon from '@public/icons/large/board.svg';
import CalendarIcon from '@public/icons/large/calendar.svg';
import ChatIcon from '@public/icons/large/chat.svg';
import NotesIcon from '@public/icons/large/notes.svg';
import ReminderIcon from '@public/icons/large/reminder.svg';
import SearchIcon from '@public/icons/small/search.svg';

interface SearchResultRowProps {
  result: ProjectSearchResult;
  active: boolean;
  onSelect: () => void;
}

const RESULT_ICONS: Record<
  ProjectSearchKind,
  React.FC<SVGProps<SVGSVGElement>>
> = {
  navigation: SearchIcon,
  board: BoardIcon,
  card: BoardIcon,
  chat: ChatIcon,
  message: ChatIcon,
  note: NotesIcon,
  calendar: CalendarIcon,
  reminder: ReminderIcon,
};

const RESULT_LABEL_KEYS: Record<ProjectSearchKind, TranslationKey> = {
  navigation: 'header.searchType.navigation',
  board: 'header.searchType.board',
  card: 'header.searchType.card',
  chat: 'header.searchType.chat',
  message: 'header.searchType.message',
  note: 'header.searchType.note',
  calendar: 'header.searchType.calendar',
  reminder: 'header.searchType.reminder',
};

const SearchResultRow = ({
  result,
  active,
  onSelect,
}: SearchResultRowProps) => {
  const { locale, t } = useTranslation();
  const Icon = RESULT_ICONS[result.kind];
  const title = result.title_key ? t(result.title_key) : result.title;
  const kindLabel = t(RESULT_LABEL_KEYS[result.kind]);
  let context = result.context;

  if (context && (result.kind === 'calendar' || result.kind === 'reminder')) {
    const parsed = new Date(
      result.kind === 'calendar' ? `${context}T00:00:00` : context,
    );
    if (!Number.isNaN(parsed.getTime())) {
      context = parsed.toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
  }

  return (
    <Link
      href={result.href}
      role="option"
      aria-selected={active}
      onClick={onSelect}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
        active ? 'bg-dark-surface-3' : 'hover:bg-dark-surface-3'
      }`}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-dark-surface-1 text-dark-secondary">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-small font-semibold text-dark-primary">
          {title}
        </span>
        {context && (
          <span className="mt-0.5 block truncate text-xsmall text-dark-secondary">
            {context}
          </span>
        )}
      </span>
      <span className="shrink-0 rounded-md bg-dark-surface-1 px-2 py-1 text-micro font-semibold text-dark-secondary">
        {kindLabel}
      </span>
    </Link>
  );
};

export default SearchResultRow;
