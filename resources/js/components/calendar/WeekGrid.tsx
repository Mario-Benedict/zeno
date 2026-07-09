import { useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useWheelStepNavigation } from '@/hooks/useWheelStepNavigation';
import type { TranslationKey } from '@/i18n/dictionary';
import type { AnyCalendarEvent, CalendarMember } from '@/types/calendar';
import { WeekEventCard } from './WeekEventCard';

interface WeekGridProps {
  currentDate: Date;
  events: AnyCalendarEvent[];
  members: CalendarMember[];
  onDateClick: (date: Date) => void;
  onEventClick: (event: AnyCalendarEvent) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
}

const DAY_KEYS: TranslationKey[] = [
  'calendar.daySun',
  'calendar.dayMon',
  'calendar.dayTue',
  'calendar.dayWed',
  'calendar.dayThu',
  'calendar.dayFri',
  'calendar.daySat',
];
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 60; // px per hour
const GRID_HEIGHT = HOUR_HEIGHT * 24;

type PlacedEvent = AnyCalendarEvent & { left: number; width: number };

export const WeekGrid = ({
  currentDate,
  events,
  members,
  onDateClick,
  onEventClick,
  onPrevWeek,
  onNextWeek,
}: WeekGridProps) => {
  const { t } = useTranslation();
  // Scrolling the hour grid works normally (browsing hours within the visible
  // week); only once it's already scrolled to the very top or bottom does
  // scrolling further step to the previous/next week, so this never fights
  // with the grid's own vertical scroll.
  const scrollRef = useWheelStepNavigation<HTMLDivElement>({
    onPrev: onPrevWeek,
    onNext: onNextWeek,
    requireScrollBoundary: true,
  });

  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Timezone display for the current viewer
  const tzOffset = -(new Date().getTimezoneOffset() / 60);
  const tzString = `GMT${tzOffset >= 0 ? '+' : '-'}${String(Math.abs(Math.floor(tzOffset))).padStart(2, '0')}`;

  // Auto-scroll to the earliest event of the visible week (fallback: 7 AM).
  useEffect(() => {
    if (!scrollRef.current) return;
    let earliestHour = 7;
    const weekStartMs = startOfWeek.getTime();
    const weekEndMs = weekStartMs + 7 * 24 * 60 * 60 * 1000;
    let found = false;
    events.forEach((ev) => {
      const s = new Date(ev.start_time);
      if (s.getTime() >= weekStartMs && s.getTime() < weekEndMs) {
        const h = s.getHours();
        if (!found || h < earliestHour) {
          earliestHour = h;
          found = true;
        }
      }
    });
    const target = Math.max(0, (earliestHour - 0.5) * HOUR_HEIGHT);
    scrollRef.current.scrollTop = target;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate]);

  // Place events into side-by-side columns when they overlap in time.
  const getEventsForDay = (date: Date): PlacedEvent[] => {
    const dayStart = new Date(date);
    const dayEnd = new Date(date);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const dayEvents = events.filter((ev) => {
      const evStart = new Date(ev.start_time);
      const evEnd = new Date(ev.end_time);

      return evStart < dayEnd && evEnd > dayStart;
    });

    dayEvents.sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
    );

    const placed: PlacedEvent[] = [];

    // Group events that overlap into clusters, then lay each cluster out in columns.
    const groups: AnyCalendarEvent[][] = [];
    let currentGroup: AnyCalendarEvent[] = [];
    let groupEnd = 0;

    dayEvents.forEach((ev) => {
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
      const cols: AnyCalendarEvent[][] = [];
      group.forEach((ev) => {
        const s = new Date(ev.start_time).getTime();
        let placedCol = false;
        for (let i = 0; i < cols.length; i++) {
          const lastInCol = cols[i][cols[i].length - 1];
          if (new Date(lastInCol.end_time).getTime() <= s) {
            cols[i].push(ev);
            placedCol = true;
            break;
          }
        }
        if (!placedCol) cols.push([ev]);
      });

      const width = 100 / cols.length;
      cols.forEach((col, colIndex) => {
        col.forEach((ev) => {
          placed.push({ ...ev, left: colIndex * width, width });
        });
      });
    });

    return placed;
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-dark-border bg-dark-surface-1">
      {/* Day headers */}
      <div className="flex border-b border-dark-border">
        <div className="flex w-16 shrink-0 items-end justify-center border-r border-dark-border pb-1 text-[9px] font-semibold text-dark-secondary">
          {tzString}
        </div>
        <div className="grid flex-1 grid-cols-7">
          {weekDays.map((d, i) => {
            const isToday = d.getTime() === today.getTime();

            return (
              <div
                key={i}
                className={`flex flex-col items-center gap-0.5 border-l border-dark-border py-2 ${
                  i === 0 ? 'border-l-0' : ''
                }`}
              >
                <div
                  className={`flex flex-col items-center rounded-xl px-3 py-1 ${
                    isToday ? 'bg-accent-blue text-white' : 'text-dark-primary'
                  }`}
                >
                  <span
                    className={`text-[10px] font-semibold tracking-wider uppercase ${
                      isToday ? 'text-white/90' : 'text-dark-secondary'
                    }`}
                  >
                    {t(DAY_KEYS[d.getDay()])}
                  </span>
                  <span className="text-large font-bold">{d.getDate()}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scrollable time grid */}
      <div
        ref={scrollRef}
        className="flex min-h-0 flex-1 [scrollbar-width:none] overflow-y-auto [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {/* Time axis */}
        <div
          className="relative w-16 shrink-0 border-r border-dark-border"
          style={{ height: `${GRID_HEIGHT}px` }}
        >
          {HOURS.map((h) => (
            <div
              key={h}
              className="absolute w-full pr-2 text-right text-[10px] text-dark-secondary"
              style={{
                top: `${h * HOUR_HEIGHT}px`,
                transform: 'translateY(-50%)',
              }}
            >
              {h === 0
                ? ''
                : h < 12
                  ? `${h} AM`
                  : h === 12
                    ? '12 PM'
                    : `${h - 12} PM`}
            </div>
          ))}
        </div>

        {/* Day columns */}
        <div className="relative flex-1" style={{ height: `${GRID_HEIGHT}px` }}>
          {/* Horizontal hour lines */}
          {HOURS.map((h) => (
            <div
              key={h}
              className="absolute w-full border-b border-dark-border/40"
              style={{
                top: `${h * HOUR_HEIGHT}px`,
                height: `${HOUR_HEIGHT}px`,
              }}
            />
          ))}

          <div className="absolute inset-0 grid grid-cols-7">
            {weekDays.map((d, i) => {
              const dayEvents = getEventsForDay(d);

              return (
                <div
                  key={i}
                  className={`relative border-l border-dark-border/40 ${i === 0 ? 'border-l-0' : ''}`}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const y = e.clientY - rect.top;
                    const hour = Math.floor(y / HOUR_HEIGHT);
                    const clickedDate = new Date(d);
                    clickedDate.setHours(hour, 0, 0, 0);
                    onDateClick(clickedDate);
                  }}
                >
                  {dayEvents.map((ev) => (
                    <WeekEventCard
                      key={ev.id}
                      event={ev}
                      members={members}
                      dayStart={d}
                      style={{ left: `${ev.left}%`, width: `${ev.width}%` }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(ev);
                      }}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
