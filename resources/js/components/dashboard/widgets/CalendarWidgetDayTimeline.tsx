import { useEffect, useRef } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import type { CalendarEventFull, CalendarKanbanTask } from '@/types/calendar';
import { getEventLabelColor } from '@/utils/calendar';
import { getContrastColor } from '@/utils/kanban';

type ViewableEvent = CalendarEventFull | CalendarKanbanTask;

interface Props {
  selectedDate: Date;
  events: ViewableEvent[];
  onSelectEvent: (event: ViewableEvent) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 48;
const GRID_HEIGHT = HOUR_HEIGHT * 24;
const MIN_EVENT_HEIGHT = 20;

type PlacedEvent = ViewableEvent & {
  left: number;
  width: number;
  top: number;
  height: number;
};

const minutesSinceMidnight = (date: Date) =>
  date.getHours() * 60 + date.getMinutes();

/** Lays overlapping events out into side-by-side columns and positions each
 * one by its time-of-day — same clustering approach as the full calendar
 * page's WeekGrid, just for a single day instead of seven. */
const layoutDay = (events: ViewableEvent[], day: Date): PlacedEvent[] => {
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const sorted = [...events].sort((a, b) =>
    a.start_time.localeCompare(b.start_time),
  );

  const placed: PlacedEvent[] = [];
  const groups: ViewableEvent[][] = [];
  let currentGroup: ViewableEvent[] = [];
  let groupEnd = 0;

  sorted.forEach((ev) => {
    const s = new Date(ev.start_time).getTime();
    const e = new Date(ev.end_time).getTime();

    if (currentGroup.length === 0 || s < groupEnd) {
      currentGroup.push(ev);
      groupEnd = Math.max(groupEnd, e);
    } else {
      groups.push([...currentGroup]);
      currentGroup = [ev];
      groupEnd = e;
    }
  });
  if (currentGroup.length > 0) groups.push(currentGroup);

  groups.forEach((group) => {
    const cols: ViewableEvent[][] = [];
    group.forEach((ev) => {
      const s = new Date(ev.start_time).getTime();
      let placedInCol = false;
      for (const col of cols) {
        const lastInCol = col[col.length - 1];
        if (new Date(lastInCol.end_time).getTime() <= s) {
          col.push(ev);
          placedInCol = true;
          break;
        }
      }
      if (!placedInCol) cols.push([ev]);
    });

    const width = 100 / cols.length;
    cols.forEach((col, colIndex) => {
      col.forEach((ev) => {
        const clampedStart = new Date(
          Math.max(new Date(ev.start_time).getTime(), dayStart.getTime()),
        );
        const clampedEnd = new Date(
          Math.min(new Date(ev.end_time).getTime(), dayEnd.getTime()),
        );
        const top = (minutesSinceMidnight(clampedStart) / 60) * HOUR_HEIGHT;
        const height = Math.max(
          ((clampedEnd.getTime() - clampedStart.getTime()) / 60000 / 60) *
            HOUR_HEIGHT,
          MIN_EVENT_HEIGHT,
        );
        placed.push({ ...ev, left: colIndex * width, width, top, height });
      });
    });
  });

  return placed;
};

/**
 * Hourly day timeline — events positioned by time-of-day on a scrollable
 * 24-hour grid, like a real calendar's day view, instead of a flat list.
 * Read-only: clicking an event opens the detail popup; empty time slots
 * aren't clickable (no event creation in the widget).
 */
export const CalendarWidgetDayTimeline = ({
  selectedDate,
  events,
  onSelectEvent,
}: Props) => {
  const { locale } = useTranslation();
  const localeCode = locale === 'id' ? 'id-ID' : 'en-US';
  const scrollRef = useRef<HTMLDivElement>(null);

  const placed = layoutDay(events, selectedDate);

  useEffect(() => {
    if (!scrollRef.current) return;

    const today = new Date();
    const isToday =
      today.toDateString() === new Date(selectedDate).toDateString();

    let targetMinutes = isToday ? minutesSinceMidnight(today) : 7 * 60;
    events.forEach((ev) => {
      const m = minutesSinceMidnight(new Date(ev.start_time));
      if (m < targetMinutes) targetMinutes = m;
    });

    scrollRef.current.scrollTop = Math.max(
      0,
      (targetMinutes / 60) * HOUR_HEIGHT - HOUR_HEIGHT,
    );
    // Re-scroll only when the selected day changes, not on every event refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const now = new Date();
  const showNowLine =
    now.toDateString() === new Date(selectedDate).toDateString();
  const nowTop = (minutesSinceMidnight(now) / 60) * HOUR_HEIGHT;

  return (
    <div
      ref={scrollRef}
      className="scrollbar-app min-h-0 flex-1 overflow-y-auto px-3 pb-3"
    >
      <div className="relative flex" style={{ height: `${GRID_HEIGHT}px` }}>
        <div className="relative w-9 shrink-0">
          {HOURS.map((h) =>
            h === 0 ? null : (
              <div
                key={h}
                className="absolute right-1.5 -translate-y-1/2 text-micro whitespace-nowrap text-dark-secondary/70"
                style={{ top: `${h * HOUR_HEIGHT}px` }}
              >
                {new Intl.DateTimeFormat(localeCode, {
                  hour: 'numeric',
                }).format(new Date(2000, 0, 1, h))}
              </div>
            ),
          )}
        </div>

        <div className="relative flex-1 border-l border-dark-border">
          {HOURS.map((h) => (
            <div
              key={h}
              className="absolute w-full border-b border-dark-border"
              style={{
                top: `${h * HOUR_HEIGHT}px`,
                height: `${HOUR_HEIGHT}px`,
              }}
            />
          ))}

          {showNowLine && (
            <div
              className="absolute left-0 z-10 flex w-full items-center"
              style={{ top: `${nowTop}px` }}
            >
              <span className="-ml-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-red" />
              <span className="h-px w-full bg-accent-red/60" />
            </div>
          )}

          {placed.map((ev) => {
            const color = getEventLabelColor(ev.labels);

            return (
              <button
                key={ev.id}
                type="button"
                onClick={() => onSelectEvent(ev)}
                className="absolute overflow-hidden rounded-md px-1.5 py-0.5 text-left transition hover:brightness-110"
                style={{
                  top: `${ev.top}px`,
                  height: `${ev.height}px`,
                  left: `${ev.left}%`,
                  width: `${ev.width}%`,
                  backgroundColor: color,
                  color: getContrastColor(color),
                }}
              >
                <span className="block truncate text-micro font-medium">
                  {ev.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
