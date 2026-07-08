import { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import type { TranslationKey } from '@/i18n/dictionary';
import type {
  CalendarMember,
  AnyCalendarEvent,
  CalendarViewMode,
  CalendarPriority,
} from '@/types/calendar';
import { MiniCalendar } from './MiniCalendar';

interface CalendarSidebarProps {
  viewMode: CalendarViewMode;
  onViewModeChange: (mode: CalendarViewMode) => void;
  onRefresh: () => void;
  isLoading: boolean;
  onCreate: () => void;
  currentDate: Date;
  onDateSelect: (date: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  members: CalendarMember[];
  onToggleMember: (id: number) => void;
  events: AnyCalendarEvent[];
  hiddenPriorities: Set<CalendarPriority>;
  onTogglePriority: (priority: CalendarPriority) => void;
}

const PRIORITIES: {
  key: CalendarPriority;
  labelKey: TranslationKey;
  dot: string;
}[] = [
  { key: 'low', labelKey: 'calendar.priorityLow', dot: 'bg-status-success' },
  { key: 'mid', labelKey: 'calendar.priorityMid', dot: 'bg-status-warning' },
  { key: 'high', labelKey: 'calendar.priorityHigh', dot: 'bg-status-error' },
];

const PlusIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const RefreshIcon = ({ spinning }: { spinning?: boolean }) => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={spinning ? 'animate-spin' : ''}
  >
    <path d="M21 12a9 9 0 1 1-2.64-6.36" />
    <path d="M21 3v6h-6" />
  </svg>
);

const PeopleIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export const CalendarSidebar = ({
  viewMode,
  onViewModeChange,
  onRefresh,
  isLoading,
  onCreate,
  currentDate,
  onDateSelect,
  onPrevMonth,
  onNextMonth,
  members,
  onToggleMember,
  events,
  hiddenPriorities,
  onTogglePriority,
}: CalendarSidebarProps) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  const filteredMembers = members.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex w-72 shrink-0 scrollbar-thin scrollbar-thumb-dark-surface-3 scrollbar-track-transparent flex-col gap-3 overflow-y-auto">
      {/* --- Top card: create, view toggle, mini-calendar, legend --- */}
      <div className="rounded-2xl border border-dark-border bg-dark-surface-2 p-3">
        <div className="mb-3 flex items-center gap-2">
          <button
            onClick={onCreate}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-dark-primary px-4 py-2 text-small font-semibold text-dark-surface-1 transition hover:opacity-90"
          >
            <PlusIcon />
            {t('calendar.create')}
          </button>
          <button
            onClick={() =>
              onViewModeChange(viewMode === 'month' ? 'week' : 'month')
            }
            title={t('calendar.switchView')}
            className="flex items-center gap-2 rounded-full border border-dark-border bg-dark-surface-3 px-3 py-2 text-small font-semibold text-dark-primary transition hover:bg-dark-border"
          >
            {viewMode === 'month' ? t('calendar.month') : t('calendar.week')}
            <span
              role="button"
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation();
                if (!isLoading) onRefresh();
              }}
              title={t('calendar.refresh')}
              className="text-dark-secondary transition hover:text-dark-primary"
            >
              <RefreshIcon spinning={isLoading} />
            </span>
          </button>
        </div>

        <MiniCalendar
          currentDate={currentDate}
          onDateSelect={onDateSelect}
          onPrevMonth={onPrevMonth}
          onNextMonth={onNextMonth}
          events={events}
        />

        <div className="mt-3 flex items-center justify-center gap-2 border-t border-dark-border pt-3">
          {PRIORITIES.map((p) => {
            const active = !hiddenPriorities.has(p.key);
            const label = t(p.labelKey);

            return (
              <button
                key={p.key}
                onClick={() => onTogglePriority(p.key)}
                title={
                  active
                    ? t('calendar.hidePriority', { priority: label })
                    : t('calendar.showPriority', { priority: label })
                }
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xsmall font-medium transition ${
                  active
                    ? 'border-dark-border bg-dark-surface-3 text-dark-primary'
                    : 'border-transparent bg-transparent text-dark-secondary/60 line-through'
                }`}
              >
                <span className={`h-2.5 w-2.5 rounded-full ${p.dot}`} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* --- Bottom card: people search + member list --- */}
      <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-dark-border bg-dark-surface-2 p-3">
        <div className="relative mb-3">
          <span className="absolute top-1/2 left-3 -translate-y-1/2 text-dark-secondary">
            <PeopleIcon />
          </span>
          <input
            type="text"
            placeholder={t('calendar.searchForPeople')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-full border border-dark-border bg-dark-surface-1 py-2 pr-9 pl-10 text-small text-dark-primary transition outline-none placeholder:text-dark-secondary focus:border-dark-border-focus"
          />
          <span className="absolute top-1/2 right-3 -translate-y-1/2 text-dark-secondary">
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </span>
        </div>

        <div className="-mr-1 flex-1 scrollbar-thin scrollbar-thumb-dark-surface-3 scrollbar-track-transparent overflow-y-auto pr-1">
          <div className="flex flex-col gap-1">
            {filteredMembers.map((member) => (
              <label
                key={member.id}
                className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-dark-surface-3"
              >
                <input
                  type="checkbox"
                  checked={member.checked}
                  onChange={() => onToggleMember(member.id)}
                  className="peer sr-only"
                />
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                    member.checked
                      ? 'border-dark-surface-3 bg-dark-surface-3'
                      : 'border-dark-secondary bg-transparent'
                  }`}
                >
                  {member.checked && (
                    <svg
                      className="h-3.5 w-3.5 text-dark-primary"
                      viewBox="0 0 14 14"
                      fill="none"
                    >
                      <path
                        d="M3 7.5L5.5 10L11 4"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>

                <span className="text-dark-secondary">
                  <PeopleIcon />
                </span>

                <span className="flex-1 truncate text-small font-medium text-dark-primary">
                  {member.name}
                </span>

                <span
                  className="h-4 w-4 shrink-0 rounded-full ring-1 ring-black/20"
                  style={{ backgroundColor: member.color }}
                />
              </label>
            ))}
            {filteredMembers.length === 0 && (
              <p className="py-4 text-center text-small text-dark-secondary">
                {t('calendar.noMembersFound')}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
