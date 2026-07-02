import type { AnyCalendarEvent, CalendarMember } from '@/types/calendar';
import { MonthDayCell } from './MonthDayCell';

interface MonthGridProps {
  currentDate: Date;
  events: AnyCalendarEvent[];
  members: CalendarMember[];
  onDateClick: (date: Date) => void;
  onEventClick: (event: AnyCalendarEvent) => void;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const MonthGrid = ({
  currentDate,
  events,
  members,
  onDateClick,
  onEventClick,
}: MonthGridProps) => {
  const viewYear = currentDate.getFullYear();
  const viewMonth = currentDate.getMonth();

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const cells: { date: Date; isCurrentMonth: boolean }[] = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({
      date: new Date(viewYear, viewMonth - 1, daysInPrevMonth - i),
      isCurrentMonth: false,
    });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      date: new Date(viewYear, viewMonth, d),
      isCurrentMonth: true,
    });
  }
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({
      date: new Date(viewYear, viewMonth + 1, d),
      isCurrentMonth: false,
    });
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-dark-border bg-dark-surface-1">
      <div className="grid grid-cols-7 border-b border-dark-border">
        {DAYS.map((d, i) => (
          <div
            key={i}
            className="py-2.5 text-center text-xsmall font-semibold tracking-wider text-dark-secondary uppercase"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-6">
        {cells.map(({ date, isCurrentMonth }, i) => (
          <MonthDayCell
            key={i}
            date={date}
            isCurrentMonth={isCurrentMonth}
            events={events}
            members={members}
            onClick={() => onDateClick(date)}
            onEventClick={onEventClick}
          />
        ))}
      </div>
    </div>
  );
};
