import { useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import type { AnyCalendarEvent, CalendarMember } from '@/types/calendar';
import { getEventLabelColor } from '@/utils/calendar';
import { DayEventsPopup } from './DayEventsPopup';

interface MonthDayCellProps {
  date: Date;
  isCurrentMonth: boolean;
  events: AnyCalendarEvent[];
  members: CalendarMember[];
  onClick: () => void;
  onEventClick: (event: AnyCalendarEvent) => void;
}

// Approximate rendered height (px) of one event row: text-[11px] leading-tight
// (~14px) + py-px (~2px) + the gap-0.5 to the next row (~2px).
const EVENT_ROW_HEIGHT = 18;
const MIN_VISIBLE_EVENTS = 1;
// Used only for the very first render, before the row container has been
// measured — overwritten by the ResizeObserver a frame later.
const FALLBACK_MAX_VISIBLE_EVENTS = 5;

const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const formatTime = (iso: string) =>
  new Date(iso)
    .toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
    .replace(':00', '')
    .replace(' ', '')
    .toLowerCase();

export const MonthDayCell = ({
  date,
  isCurrentMonth,
  events,
  members,
  onClick,
  onEventClick,
}: MonthDayCellProps) => {
  const { t } = useTranslation();
  const [popupOpen, setPopupOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const [maxVisible, setMaxVisible] = useState(FALLBACK_MAX_VISIBLE_EVENTS);

  // The number of events that fit depends on the cell's actual rendered
  // height (which varies with viewport size, not just MAX_VISIBLE_EVENTS),
  // so it's measured rather than fixed — otherwise events silently overflow
  // the cell with no "+N more" affordance to reach the rest.
  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;

    const measure = () => {
      const rows = Math.floor(el.clientHeight / EVENT_ROW_HEIGHT);
      setMaxVisible(Math.max(MIN_VISIBLE_EVENTS, rows));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  // Find events that overlap this day
  const dayEvents = events.filter((ev) => {
    const start = new Date(ev.start_time);
    const end = new Date(ev.end_time);
    const cellDate = new Date(date);
    cellDate.setHours(0, 0, 0, 0);
    const cellNext = new Date(cellDate);
    cellNext.setDate(cellNext.getDate() + 1);

    return start < cellNext && end > cellDate;
  });

  dayEvents.sort(
    (a, b) =>
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
  );

  // Reserve one row for the "+N more" button itself whenever not everything
  // fits, so the button never gets pushed out of the visible area.
  const visibleEvents =
    dayEvents.length > maxVisible
      ? dayEvents.slice(0, Math.max(MIN_VISIBLE_EVENTS, maxVisible - 1))
      : dayEvents;
  const hiddenCount = dayEvents.length - visibleEvents.length;

  const ownerName = (ev: AnyCalendarEvent) => {
    const first = ev.participants[0]?.name ?? t('calendar.unknownMember');
    const extra = ev.participants.length - 1;

    return extra > 0 ? `${first} +${extra}` : first;
  };

  const dayLabel =
    date.getDate() === 1
      ? `${MONTHS_SHORT[date.getMonth()]} 1`
      : `${date.getDate()}`;

  return (
    <div
      onClick={onClick}
      className={`relative flex min-h-0 cursor-pointer flex-col border-r border-b border-dark-border p-1.5 transition-colors hover:bg-dark-surface-2/60 ${
        isCurrentMonth ? '' : 'bg-dark-surface-1/40'
      }`}
    >
      <div className="mb-1 flex items-center">
        <span
          className={`flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xsmall font-semibold ${
            isToday
              ? 'bg-accent-blue text-white'
              : isCurrentMonth
                ? 'text-dark-primary'
                : 'text-dark-secondary/40'
          }`}
        >
          {dayLabel}
        </span>
      </div>

      <div
        ref={listRef}
        className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden"
      >
        {visibleEvents.map((ev) => {
          const time = formatTime(ev.start_time);

          if (ev.is_classified) {
            // "busy_only" shows only a bare dot on the day cell — no time,
            // no label, no name.
            if (ev.visibility === 'busy_only') {
              return (
                <button
                  key={ev.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEventClick(ev);
                  }}
                  title={t('calendar.classified')}
                  className="flex items-center gap-1.5 truncate rounded px-1 py-px text-left hover:bg-dark-surface-3"
                >
                  <span className="h-2 w-2 shrink-0 rounded-full bg-dark-secondary/50" />
                </button>
              );
            }

            return (
              <button
                key={ev.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onEventClick(ev);
                }}
                className="flex items-center gap-1.5 truncate rounded px-1 py-px text-left text-[11px] leading-tight text-dark-secondary hover:bg-dark-surface-3"
              >
                <span className="shrink-0 text-dark-secondary/80 tabular-nums">
                  {time}
                </span>
                <span className="h-2 w-2 shrink-0 rounded-full bg-dark-secondary/50" />
                <span className="truncate italic">
                  {t('calendar.classified')} · {ownerName(ev)}
                </span>
              </button>
            );
          }

          return (
            <button
              key={ev.id}
              onClick={(e) => {
                e.stopPropagation();
                onEventClick(ev);
              }}
              className="flex items-center gap-1.5 truncate rounded px-1 py-px text-left text-[11px] leading-tight hover:bg-dark-surface-3"
            >
              <span className="shrink-0 text-dark-secondary tabular-nums">
                {time}
              </span>
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: getEventLabelColor(ev.labels) }}
              />
              <span
                className={`truncate font-semibold text-dark-primary ${ev.is_kanban_task && ev.is_completed ? 'text-dark-secondary line-through' : ''}`}
              >
                {ownerName(ev)}
              </span>
            </button>
          );
        })}

        {hiddenCount > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setPopupOpen(true);
            }}
            className="mt-px pl-1 text-left text-[11px] font-medium text-dark-secondary hover:text-dark-primary"
          >
            {t('calendar.moreEvents', { count: hiddenCount })}
          </button>
        )}
      </div>

      {popupOpen && (
        <DayEventsPopup
          date={date}
          events={dayEvents}
          members={members}
          onClose={() => setPopupOpen(false)}
          onEventClick={onEventClick}
        />
      )}
    </div>
  );
};
