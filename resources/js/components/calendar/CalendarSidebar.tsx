import { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import type {
  AnyCalendarEvent,
  CalendarMember,
  CalendarTaskSourceFilter,
  CalendarViewMode,
} from '@/types/calendar';
import type { CardLabel } from '@/types/kanban';
import CancelIcon from '@public/icons/small/cancel.svg';
import CheckIcon from '@public/icons/small/check.svg';
import PeopleIcon from '@public/icons/small/people.svg';
import PlusIcon from '@public/icons/small/plus.svg';
import RestartIcon from '@public/icons/small/restart.svg';
import SearchIcon from '@public/icons/small/search.svg';
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
  onToggleAllMembers: (ids: number[], checked: boolean) => void;
  events: AnyCalendarEvent[];
  cardLabels: CardLabel[];
  hiddenLabelIds: Set<string>;
  onToggleLabel: (labelId: string) => void;
  taskSourceFilter: CalendarTaskSourceFilter;
  onTaskSourceFilterChange: (filter: CalendarTaskSourceFilter) => void;
  /** Mobile in-page drawer open state (ignored on md+ where it's a static rail). */
  open?: boolean;
  /** Close the mobile drawer. */
  onClose?: () => void;
}

const MAX_VISIBLE_LABELS = 6;

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
  onToggleAllMembers,
  events,
  cardLabels,
  hiddenLabelIds,
  onToggleLabel,
  taskSourceFilter,
  onTaskSourceFilterChange,
  open = false,
  onClose,
}: CalendarSidebarProps) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [labelsExpanded, setLabelsExpanded] = useState(false);

  const taskSourceOptions: {
    value: CalendarTaskSourceFilter;
    label: string;
  }[] = [
    { value: 'all', label: t('calendar.taskSourceAll') },
    { value: 'own', label: t('calendar.taskSourceThisProject') },
    { value: 'other', label: t('calendar.taskSourceOtherProjects') },
  ];

  const filteredMembers = members.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()),
  );
  const checkedCount = members.filter((m) => m.checked).length;
  const allFilteredChecked =
    filteredMembers.length > 0 && filteredMembers.every((m) => m.checked);

  const visibleLabels = labelsExpanded
    ? cardLabels
    : cardLabels.slice(0, MAX_VISIBLE_LABELS);

  return (
    <>
      {/* Mobile backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`absolute inset-0 z-30 rounded-lg bg-black/50 transition-opacity duration-200 md:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      <div
        className={`scrollbar-app flex w-72 shrink-0 flex-col gap-3 overflow-y-auto max-md:absolute max-md:inset-y-0 max-md:left-0 max-md:z-40 max-md:w-[85%] max-md:max-w-xs max-md:bg-dark-surface-1 max-md:p-1 max-md:shadow-2xl max-md:transition-transform max-md:duration-200 ${
          open ? 'max-md:translate-x-0' : 'max-md:-translate-x-[110%]'
        }`}
      >
        {/* Mobile drawer header with close */}
        <div className="flex items-center justify-between px-1 md:hidden">
          <span className="text-small font-semibold text-dark-primary">
            {t('calendar.pageTitle')}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="rounded-lg p-1 text-dark-secondary transition-colors hover:bg-dark-surface-3 hover:text-dark-primary"
          >
            <CancelIcon className="h-4 w-4" />
          </button>
        </div>
        {/* --- Top card: create, view toggle, mini-calendar, legend --- */}
        <div className="rounded-2xl border border-dark-border bg-dark-surface-2 p-3">
          <div className="mb-3 flex items-center gap-2">
            <button
              onClick={() => {
                onClose?.();
                onCreate();
              }}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-dark-primary px-4 py-2 text-small font-semibold text-dark-surface-1 transition hover:opacity-90"
            >
              <PlusIcon className="h-4 w-4" />
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
                <RestartIcon
                  className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`}
                />
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

          {cardLabels.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5 border-t border-dark-border pt-3">
              {visibleLabels.map((label) => {
                const active = !hiddenLabelIds.has(label.card_label_id);

                return (
                  <button
                    key={label.card_label_id}
                    onClick={() => onToggleLabel(label.card_label_id)}
                    title={
                      active
                        ? t('calendar.hideLabel', {
                            label: label.card_label_name,
                          })
                        : t('calendar.showLabel', {
                            label: label.card_label_name,
                          })
                    }
                    className={`flex max-w-[8.5rem] items-center gap-1.5 rounded-full border px-2.5 py-1 text-xsmall font-medium transition ${
                      active
                        ? 'border-dark-border bg-dark-surface-3 text-dark-primary'
                        : 'border-transparent bg-transparent text-dark-secondary/60 line-through'
                    }`}
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: label.card_label_color_hex }}
                    />
                    <span className="truncate">{label.card_label_name}</span>
                  </button>
                );
              })}
              {cardLabels.length > MAX_VISIBLE_LABELS && (
                <button
                  onClick={() => setLabelsExpanded((v) => !v)}
                  className="rounded-full px-2.5 py-1 text-xsmall font-medium text-dark-secondary transition hover:text-dark-primary"
                >
                  {labelsExpanded
                    ? t('calendar.showLessLabels')
                    : t('calendar.moreLabels', {
                        count: cardLabels.length - MAX_VISIBLE_LABELS,
                      })}
                </button>
              )}
            </div>
          )}

          <div className="mt-3 border-t border-dark-border pt-3">
            <p className="mb-1.5 text-xsmall font-medium text-dark-secondary">
              {t('calendar.taskSourceFilterLabel')}
            </p>
            <div className="flex rounded-full border border-dark-border bg-dark-surface-3 p-0.5">
              {taskSourceOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onTaskSourceFilterChange(option.value)}
                  className={`flex-1 rounded-full px-2 py-1 text-xsmall font-semibold transition ${
                    taskSourceFilter === option.value
                      ? 'bg-dark-primary text-dark-surface-1'
                      : 'text-dark-secondary hover:text-dark-primary'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* --- Bottom card: people search + member list --- */}
        {/* A min-height floor keeps the member list usable even when the
          legend above grows tall (many labels) — the outer sidebar already
          scrolls as a whole, so this card is never squeezed to nothing. */}
        <div className="flex min-h-[17rem] flex-1 flex-col rounded-2xl border border-dark-border bg-dark-surface-2 p-3">
          <div className="relative mb-3">
            <span className="absolute top-1/2 left-3 -translate-y-1/2 text-dark-secondary">
              <PeopleIcon className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder={t('calendar.searchForPeople')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full border border-dark-border bg-dark-surface-1 py-2 pr-9 pl-10 text-small text-dark-primary transition outline-none placeholder:text-dark-secondary focus:border-dark-border-focus"
            />
            <span className="absolute top-1/2 right-3 -translate-y-1/2 text-dark-secondary">
              <SearchIcon className="h-4 w-4" />
            </span>
          </div>

          <div className="mb-2 flex items-center justify-between px-1">
            <span className="text-xsmall text-dark-secondary">
              {t('calendar.membersSelectedCount', {
                checked: checkedCount,
                total: members.length,
              })}
            </span>
            <button
              onClick={() =>
                onToggleAllMembers(
                  filteredMembers.map((m) => m.id),
                  !allFilteredChecked,
                )
              }
              disabled={filteredMembers.length === 0}
              className="text-xsmall font-semibold text-dark-secondary transition hover:text-dark-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              {allFilteredChecked
                ? t('calendar.deselectAll')
                : t('calendar.selectAll')}
            </button>
          </div>

          <div className="scrollbar-app -mr-1 flex-1 overflow-y-auto pr-1">
            <div className="flex flex-col gap-0.5">
              {filteredMembers.map((member) => (
                <label
                  key={member.id}
                  className="relative flex cursor-pointer items-center gap-3 rounded-xl px-2 py-1.5 transition hover:bg-dark-surface-3"
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
                      <CheckIcon className="h-3 w-3 text-dark-primary" />
                    )}
                  </div>

                  <span className="text-dark-secondary">
                    <PeopleIcon className="h-4 w-4" />
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
    </>
  );
};
