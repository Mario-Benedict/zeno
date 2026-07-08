import { useTranslation } from '@/hooks/useTranslation';
import type { TranslationKey } from '@/i18n/dictionary';
import type { AnyCalendarEvent } from '@/types/calendar';

interface MiniCalendarProps {
  currentDate: Date;
  onDateSelect: (date: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  events: AnyCalendarEvent[];
}

const DAY_LETTER_KEYS: TranslationKey[] = [
  'calendar.dayLetterSun',
  'calendar.dayLetterMon',
  'calendar.dayLetterTue',
  'calendar.dayLetterWed',
  'calendar.dayLetterThu',
  'calendar.dayLetterFri',
  'calendar.dayLetterSat',
];
const MONTH_KEYS: TranslationKey[] = [
  'calendar.monthJanuary',
  'calendar.monthFebruary',
  'calendar.monthMarch',
  'calendar.monthApril',
  'calendar.monthMay',
  'calendar.monthJune',
  'calendar.monthJuly',
  'calendar.monthAugust',
  'calendar.monthSeptember',
  'calendar.monthOctober',
  'calendar.monthNovember',
  'calendar.monthDecember',
];

export const MiniCalendar = ({
  currentDate,
  onDateSelect,
  onPrevMonth,
  onNextMonth,
  events,
}: MiniCalendarProps) => {
  const { t } = useTranslation();
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

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const selectedMidnight = new Date(currentDate);
  selectedMidnight.setHours(0, 0, 0, 0);

  // Quick lookup for dates that have events (mark by start date).
  const eventDates = new Set<string>();
  events.forEach((ev) => {
    const d = new Date(ev.start_time);
    eventDates.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
  });

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-small font-semibold text-dark-primary">
          {t(MONTH_KEYS[viewMonth])} {viewYear}
        </span>
        <div className="flex gap-1">
          <button
            onClick={onPrevMonth}
            className="flex h-6 w-6 items-center justify-center rounded-full text-dark-secondary transition hover:bg-dark-surface-3 hover:text-dark-primary"
          >
            ‹
          </button>
          <button
            onClick={onNextMonth}
            className="flex h-6 w-6 items-center justify-center rounded-full text-dark-secondary transition hover:bg-dark-surface-3 hover:text-dark-primary"
          >
            ›
          </button>
        </div>
      </div>
      <div className="mb-1 grid grid-cols-7">
        {DAY_LETTER_KEYS.map((key, i) => (
          <div
            key={i}
            className="text-center text-[10px] font-medium text-dark-secondary"
          >
            {t(key)}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map(({ date, isCurrentMonth }, i) => {
          const isToday = date.getTime() === today.getTime();
          const isSelected = date.getTime() === selectedMidnight.getTime();
          const hasEvent = eventDates.has(
            `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
          );

          // Priority of visual states (matches the reference design):
          // today -> neutral grey, has-event -> solid blue, selected -> ring.
          let stateClass = isCurrentMonth
            ? 'text-dark-primary hover:bg-dark-surface-3'
            : 'text-dark-secondary/40 hover:text-dark-secondary';

          if (isToday) {
            stateClass = 'bg-dark-surface-3 font-semibold text-dark-primary';
          } else if (hasEvent && isCurrentMonth) {
            stateClass = 'bg-accent-blue font-semibold text-white';
          } else if (isSelected) {
            stateClass = 'text-dark-primary ring-1 ring-accent-blue ring-inset';
          }

          return (
            <button
              key={i}
              onClick={() => onDateSelect(date)}
              className={`relative mx-auto flex h-7 w-7 items-center justify-center rounded-full text-xsmall transition-colors ${stateClass}`}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
};
