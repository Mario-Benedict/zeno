import { useEffect, useMemo, useState } from 'react';
import { useProject } from '@/hooks/useProject';
import { useTranslation } from '@/hooks/useTranslation';
import { inertiaJson } from '@/lib/inertiaJson';
import projects from '@/routes/projects';
import type {
  AnyCalendarEvent,
  CalendarEventFull,
  CalendarKanbanTask,
} from '@/types/calendar';
import { CalendarWidgetDayTimeline } from './CalendarWidgetDayTimeline';
import { CalendarWidgetEventDetail } from './CalendarWidgetEventDetail';
import { CalendarWidgetWeekStrip } from './CalendarWidgetWeekStrip';

interface Props {
  currentUserId: number;
}

const startOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const sameDay = (a: Date, b: Date) =>
  startOfDay(a).getTime() === startOfDay(b).getTime();

/** Sunday of the week containing `date` — matches the full calendar page's
 * own week-bounds computation (`start.getDate() - start.getDay()`). */
const startOfWeek = (date: Date) => {
  const d = startOfDay(date);
  d.setDate(d.getDate() - d.getDay());
  return d;
};

/** The widget only ever requests the viewer's own user id, so a CLASSIFIED
 * (privacy-masked) event should never actually appear, but the type is
 * still a union and TS needs the guard to narrow it out. */
const isViewable = (
  event: AnyCalendarEvent,
): event is CalendarEventFull | CalendarKanbanTask => !event.is_classified;

/**
 * Compact week-strip + hourly day-timeline calendar for a dashboard slot —
 * not the full calendar page. Permanently a single week row (no month/week
 * toggle): a month grid ate too much vertical space in a dashboard slot, and
 * one row of 7 days stays usable whether the slot is small or large. The
 * selected day's events render on a scrollable 24-hour timeline (positioned
 * by time, like a real calendar's day view) instead of a flat list. Read-only
 * (view the week, view a day's events, view one event's detail); no
 * create/edit/delete, no member overlay picker. Always scoped to the
 * viewer's own events (the same `calendar.events.index` endpoint the full
 * page uses, requested with just their own user id), so it never has to
 * render CLASSIFIED cross-project busy-blocks.
 */
export const CalendarWidget = ({ currentUserId }: Props) => {
  const { project, accountIndex } = useProject();
  const { t } = useTranslation();

  const today = useMemo(() => new Date(), []);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today));
  const [selectedDate, setSelectedDate] = useState(today);
  const [events, setEvents] = useState<AnyCalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<
    CalendarEventFull | CalendarKanbanTask | null
  >(null);

  useEffect(() => {
    let cancelled = false;
    // Reset for the newly viewed week before fetching its events.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);

    const rangeStart = new Date(weekStart);
    const rangeEnd = new Date(weekStart);
    rangeEnd.setDate(rangeEnd.getDate() + 7);

    inertiaJson<AnyCalendarEvent[]>(
      'get',
      projects.calendar.events.index.url(
        { accountIndex, project: project.project_slug },
        {
          query: {
            start: rangeStart.toISOString(),
            end: rangeEnd.toISOString(),
            users: [currentUserId],
          },
        },
      ),
    )
      .then((data) => {
        if (!cancelled) setEvents(data);
      })
      .catch(() => console.error('Failed to load calendar events'))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [accountIndex, project.project_slug, currentUserId, weekStart]);

  const dayEvents = events
    .filter(isViewable)
    .filter((ev) => sameDay(new Date(ev.start_time), selectedDate));

  const goToToday = () => {
    setWeekStart(startOfWeek(today));
    setSelectedDate(today);
  };

  const shiftWeek = (deltaWeeks: number) => {
    const next = new Date(weekStart);
    next.setDate(next.getDate() + deltaWeeks * 7);
    setWeekStart(next);
  };

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl bg-dark-surface-2">
      <div className="flex shrink-0 items-center justify-between px-3 pt-3 pb-2">
        <span className="text-small font-semibold text-dark-primary">
          {t('calendar.pageTitle')}
        </span>
        {!sameDay(selectedDate, today) && (
          <button
            type="button"
            onClick={goToToday}
            className="rounded-full bg-dark-surface-3 px-2 py-0.5 text-micro font-medium text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            {t('dashboard.today')}
          </button>
        )}
      </div>

      <CalendarWidgetWeekStrip
        weekStart={weekStart}
        selectedDate={selectedDate}
        events={events}
        onSelectDate={setSelectedDate}
        onPrevWeek={() => shiftWeek(-1)}
        onNextWeek={() => shiftWeek(1)}
      />

      <div className="mt-2 flex min-h-0 flex-1 flex-col border-t border-white/5 pt-2">
        <p className="px-3 pb-1 text-micro font-medium text-white/30">
          {loading
            ? t('dashboard.loadingMessages')
            : t(
                dayEvents.length === 1
                  ? 'dashboard.eventCount'
                  : 'dashboard.eventCountPlural',
                { count: dayEvents.length },
              )}
        </p>
        <CalendarWidgetDayTimeline
          selectedDate={selectedDate}
          events={dayEvents}
          onSelectEvent={setSelectedEvent}
        />
      </div>

      {selectedEvent && (
        <CalendarWidgetEventDetail
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
};
