import { useTranslation } from '@/hooks/useTranslation';
import CloseIcon from '@public/icons/small/cancel.svg';
import SearchIcon from '@public/icons/small/search.svg';

interface Props {
  title: string;
  countLabel: string;
  searchOpen: boolean;
  query: string;
  onQueryChange: (value: string) => void;
  onOpenSearch: () => void;
  onCloseSearch: () => void;
  searchLabel: string;
  placeholder: string;
}

/**
 * Collapsible search header shared by the dashboard widgets (Notes, Kanban,
 * Chat): a title + count by default, swapping to a search input when the
 * search icon is clicked. Kept as one shared component since all three
 * widgets use the exact same toggle behavior/markup — only the label,
 * count, and filter target differ per widget.
 *
 * `pr-10` (instead of a symmetric `px-3`) leaves the top-right corner clear
 * for DashboardGrid's floating "remove widget" button, which is positioned
 * over the widget from outside and would otherwise sit on top of the
 * search icon.
 */
export const WidgetSearchHeader = ({
  title,
  countLabel,
  searchOpen,
  query,
  onQueryChange,
  onOpenSearch,
  onCloseSearch,
  searchLabel,
  placeholder,
}: Props) => {
  const { t } = useTranslation();

  return (
    <div className="flex shrink-0 items-center gap-2 pt-3 pr-10 pb-2 pl-3">
      {searchOpen ? (
        <>
          <SearchIcon className="h-3.5 w-3.5 shrink-0 text-dark-secondary" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={placeholder}
            className="min-w-0 flex-1 bg-transparent text-xsmall text-dark-primary placeholder-dark-secondary focus:outline-none"
          />
          <button
            type="button"
            onClick={onCloseSearch}
            aria-label={t('dashboard.closeSearch')}
            className="shrink-0 rounded p-1 text-dark-secondary transition hover:bg-dark-surface-3 hover:text-dark-primary"
          >
            <CloseIcon className="h-3.5 w-3.5" />
          </button>
        </>
      ) : (
        <>
          <span className="flex-1 text-small font-semibold text-dark-primary">
            {title}
          </span>
          <span className="text-xsmall text-dark-secondary/80">
            {countLabel}
          </span>
          <button
            type="button"
            onClick={onOpenSearch}
            aria-label={searchLabel}
            className="shrink-0 rounded p-1 text-dark-secondary transition hover:bg-dark-surface-3 hover:text-dark-primary"
          >
            <SearchIcon className="h-3.5 w-3.5" />
          </button>
        </>
      )}
    </div>
  );
};
