import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import type { CardLabel, KanbanBoard, KanbanUser } from '@/types/kanban';
import type { TimelineFilters, TimelineSortKey } from '@/types/timeline';
import FilterIcon from '@public/icons/large/filter.svg';
import SortIcon from '@public/icons/large/sort.svg';
import PlusIcon from '@public/icons/small/plus.svg';
import SearchIcon from '@public/icons/small/search.svg';
import { TimelineFilterMenu } from './TimelineFilterMenu';
import { TimelineSortMenu } from './TimelineSortMenu';

interface TimelineHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filters: TimelineFilters;
  onFiltersChange: (filters: TimelineFilters) => void;
  sortKey: TimelineSortKey;
  onSortChange: (key: TimelineSortKey) => void;
  cardLabels: CardLabel[];
  projectUsers: KanbanUser[];
  boards: KanbanBoard[];
  canAddTask: boolean;
  onAddTask: () => void;
}

type OpenMenu = 'filter' | 'sort' | null;

export const TimelineHeader = ({
  searchQuery,
  onSearchChange,
  filters,
  onFiltersChange,
  sortKey,
  onSortChange,
  cardLabels,
  projectUsers,
  boards,
  canAddTask,
  onAddTask,
}: TimelineHeaderProps) => {
  const { t } = useTranslation();
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const activeFilterCount =
    filters.labelIds.length +
    filters.memberIds.length +
    filters.boardIds.length;

  useEffect(() => {
    if (!openMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openMenu]);

  return (
    <header className="flex w-full shrink-0 items-center justify-between gap-2 px-2 py-2 sm:gap-3">
      <div className="relative min-w-0 flex-1 sm:flex-none">
        <input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          type="text"
          placeholder={t('timeline.search')}
          className="w-full rounded-full border-2 border-dark-surface-3 bg-dark-surface-2 px-4 py-2 pl-9 text-small font-semibold text-dark-primary placeholder-dark-secondary transition focus:border-dark-border-focus focus:outline-none sm:w-64"
        />
        <span className="absolute top-1/2 left-3 -translate-y-1/2 text-dark-secondary">
          <SearchIcon className="h-4 w-4" />
        </span>
      </div>

      <div ref={menuRef} className="flex shrink-0 items-center gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={() =>
              setOpenMenu((m) => (m === 'filter' ? null : 'filter'))
            }
            className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-small font-semibold transition ${
              openMenu === 'filter' || activeFilterCount > 0
                ? 'border-dark-border-focus text-dark-primary'
                : 'border-dark-surface-3 text-dark-secondary hover:text-dark-primary'
            }`}
          >
            <FilterIcon className="h-4 w-4" />
            <span className="hidden sm:inline">{t('timeline.filter')}</span>
            {activeFilterCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-blue px-1 text-micro font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
          {openMenu === 'filter' && (
            <TimelineFilterMenu
              cardLabels={cardLabels}
              projectUsers={projectUsers}
              boards={boards}
              filters={filters}
              onChange={onFiltersChange}
            />
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenMenu((m) => (m === 'sort' ? null : 'sort'))}
            className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-small font-semibold transition ${
              openMenu === 'sort'
                ? 'border-dark-border-focus text-dark-primary'
                : 'border-dark-surface-3 text-dark-secondary hover:text-dark-primary'
            }`}
          >
            <SortIcon className="h-4 w-4" />
            <span className="hidden sm:inline">{t('timeline.sort')}</span>
          </button>
          {openMenu === 'sort' && (
            <TimelineSortMenu sortKey={sortKey} onChange={onSortChange} />
          )}
        </div>

        <button
          type="button"
          onClick={onAddTask}
          disabled={!canAddTask}
          title={canAddTask ? undefined : t('timeline.createBoardFirst')}
          className="hover:bg-opacity-90 flex items-center gap-2 rounded-lg bg-accent-blue px-3 py-2 text-small font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
        >
          <PlusIcon className="h-4 w-4" />
          <span className="hidden sm:inline">{t('timeline.addNewTask')}</span>
        </button>
      </div>
    </header>
  );
};
