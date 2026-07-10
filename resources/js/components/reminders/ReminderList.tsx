import { useMemo, useState } from 'react';
import { PinIcon } from '@/components/shared/PinButton';
import { useTranslation } from '@/hooks/useTranslation';
import type { Reminder } from '@/types/reminder';
import FilterIcon from '@public/icons/large/filter.svg';
import ArrowDownIcon from '@public/icons/small/arrow_down.svg';
import PlusIcon from '@public/icons/small/plus.svg';
import SearchIcon from '@public/icons/small/search.svg';
import { ReminderRow } from './ReminderRow';

interface ReminderListProps {
  reminders: Reminder[];
  selectedReminderId: string | null;
  onSelect: (reminder: Reminder) => void;
  onToggleComplete: (reminder: Reminder) => void;
  onTogglePin: (reminder: Reminder) => void;
  onDelete: (reminder: Reminder) => void;
  onAddClick: () => void;
}

export const ReminderList = ({
  reminders,
  selectedReminderId,
  onSelect,
  onToggleComplete,
  onTogglePin,
  onDelete,
  onAddClick,
}: ReminderListProps) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [sortDesc, setSortDesc] = useState(false);
  const [dueOnly, setDueOnly] = useState(false);
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [completedOpen, setCompletedOpen] = useState(true);

  const filtered = useMemo(() => {
    let list = reminders;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((r) => r.reminder_title.toLowerCase().includes(q));
    }
    if (dueOnly) list = list.filter((r) => r.reminder_due_at !== null);
    if (pinnedOnly) list = list.filter((r) => r.is_pinned);

    return [...list].sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
      const aTime = a.reminder_due_at
        ? new Date(a.reminder_due_at).getTime()
        : Infinity;
      const bTime = b.reminder_due_at
        ? new Date(b.reminder_due_at).getTime()
        : Infinity;

      return sortDesc ? bTime - aTime : aTime - bTime;
    });
  }, [reminders, search, sortDesc, dueOnly, pinnedOnly]);

  const active = filtered.filter((r) => !r.is_completed);
  const completed = filtered.filter((r) => r.is_completed);

  return (
    <div className="flex w-90 shrink-0 flex-col overflow-hidden rounded-2xl bg-dark-surface-2 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-large font-bold text-dark-primary">
          {t('reminders.title')}
        </h1>
        <button
          type="button"
          onClick={onAddClick}
          className="hover:bg-opacity-90 flex items-center gap-1.5 rounded-lg bg-accent-blue px-3 py-1.5 text-small font-semibold text-white transition"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          {t('reminders.add')}
        </button>
      </div>

      <div className="mb-3 flex items-center gap-2">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-dark-secondary">
            <SearchIcon className="h-4 w-4" />
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="text"
            placeholder={t('reminders.search')}
            className="h-9 w-full rounded-full border-2 border-dark-surface-3 bg-dark-surface-1 pr-3 pl-9 text-small text-dark-primary placeholder-dark-secondary transition focus:border-dark-border-focus focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={() => setSortDesc((v) => !v)}
          title={
            sortDesc
              ? t('reminders.sortLatestFirst')
              : t('reminders.sortEarliestFirst')
          }
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
            sortDesc
              ? 'bg-accent-blue/20 text-accent-blue'
              : 'bg-dark-surface-1 text-dark-secondary hover:bg-dark-surface-3'
          }`}
        >
          <ArrowDownIcon
            className={`h-3.5 w-3.5 transition-transform ${sortDesc ? 'rotate-180' : ''}`}
          />
        </button>
        <button
          type="button"
          onClick={() => setDueOnly((v) => !v)}
          title={t('reminders.onlyWithDueDate')}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
            dueOnly
              ? 'bg-accent-blue/20'
              : 'bg-dark-surface-1 hover:bg-dark-surface-3'
          }`}
        >
          <FilterIcon className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setPinnedOnly((v) => !v)}
          title={t('reminders.onlyPinned')}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
            pinnedOnly
              ? 'bg-accent-blue/20'
              : 'bg-dark-surface-1 hover:bg-dark-surface-3'
          }`}
        >
          <PinIcon filled={pinnedOnly} />
        </button>
      </div>

      <div className="scrollbar-app flex-1 space-y-2 overflow-y-auto">
        {active.length === 0 && completed.length === 0 && (
          <p className="py-8 text-center text-small text-white/20">
            {t('reminders.noRemindersYet')}
          </p>
        )}

        {active.map((reminder) => (
          <ReminderRow
            key={reminder.reminder_id}
            reminder={reminder}
            active={reminder.reminder_id === selectedReminderId}
            onSelect={() => onSelect(reminder)}
            onToggleComplete={() => onToggleComplete(reminder)}
            onTogglePin={() => onTogglePin(reminder)}
            onDelete={() => onDelete(reminder)}
          />
        ))}

        {completed.length > 0 && (
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setCompletedOpen((v) => !v)}
              className="mb-2 flex w-full items-center gap-2 rounded-lg bg-dark-surface-3 px-3 py-2 text-small font-semibold text-dark-primary"
            >
              <ArrowDownIcon
                className={`h-3 w-3 transition-transform ${completedOpen ? '' : '-rotate-90'}`}
              />
              {t('reminders.completedCount', { count: completed.length })}
            </button>
            {completedOpen && (
              <div className="space-y-2">
                {completed.map((reminder) => (
                  <ReminderRow
                    key={reminder.reminder_id}
                    reminder={reminder}
                    active={reminder.reminder_id === selectedReminderId}
                    onSelect={() => onSelect(reminder)}
                    onToggleComplete={() => onToggleComplete(reminder)}
                    onTogglePin={() => onTogglePin(reminder)}
                    onDelete={() => onDelete(reminder)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
