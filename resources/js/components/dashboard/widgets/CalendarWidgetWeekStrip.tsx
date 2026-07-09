import { useTranslation } from '@/hooks/useTranslation';
import { useWheelStepNavigation } from '@/hooks/useWheelStepNavigation';
import type { TranslationKey } from '@/i18n/dictionary';
import type { AnyCalendarEvent } from '@/types/calendar';

interface Props {
  weekStart: Date;
  selectedDate: Date;
  events: AnyCalendarEvent[];
  onSelectDate: (date: Date) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
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

const dayKey = (date: Date) =>
  `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

/**
 * Single-row week strip — the widget's permanent view (no month/week toggle
 * like the full calendar page). A 6-row month grid ate too much of a
 * dashboard slot's vertical space; one row of 7 days stays compact in a
 * small slot while a large slot just gives the day-agenda list below it
 * more room, so the same layout scales either way without breakpoints.
 */
export const CalendarWidgetWeekStrip = ({
  weekStart,
  selectedDate,
  events,
  onSelectDate,
  onPrevWeek,
  onNextWeek,
}: Props) => {
  const { t, locale } = useTranslation();
  const localeCode = locale === 'id' ? 'id-ID' : 'en-US';

  const containerRef = useWheelStepNavigation<HTMLDivElement>({
    onPrev: onPrevWeek,
    onNext: onNextWeek,
  });

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
  const weekEnd = days[6];

  const rangeLabel =
    weekStart.getMonth() === weekEnd.getMonth()
      ? `${new Intl.DateTimeFormat(localeCode, { month: 'short' }).format(weekStart)} ${weekStart.getDate()}–${weekEnd.getDate()}`
      : `${new Intl.DateTimeFormat(localeCode, { month: 'short', day: 'numeric' }).format(weekStart)} – ${new Intl.DateTimeFormat(
          localeCode,
          { month: 'short', day: 'numeric' },
        ).format(weekEnd)}`;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selectedMidnight = new Date(selectedDate);
  selectedMidnight.setHours(0, 0, 0, 0);

  const eventDates = new Set<string>();
  events.forEach((ev) => {
    if (ev.is_classified) return;
    eventDates.add(dayKey(new Date(ev.start_time)));
  });

  return (
    <div ref={containerRef} className="px-3">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xsmall font-semibold text-dark-primary">
          {rangeLabel}
        </span>
        <div className="flex gap-0.5">
          <button
            type="button"
            onClick={onPrevWeek}
            className="flex h-5 w-5 items-center justify-center rounded-full text-white/40 transition hover:bg-white/10 hover:text-white"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={onNextWeek}
            className="flex h-5 w-5 items-center justify-center rounded-full text-white/40 transition hover:bg-white/10 hover:text-white"
          >
            ›
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((date, i) => {
          const isToday = date.getTime() === today.getTime();
          const isSelected = date.getTime() === selectedMidnight.getTime();
          const hasEvent = eventDates.has(dayKey(date));

          let stateClass = 'text-white/80 hover:bg-white/10';
          if (isSelected) {
            stateClass = 'bg-accent-blue font-semibold text-white';
          } else if (isToday) {
            stateClass = 'font-semibold text-white/80 ring-1 ring-white/25';
          }

          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelectDate(date)}
              className={`flex flex-col items-center gap-0.5 rounded-lg py-1.5 transition-colors ${stateClass}`}
            >
              <span className="text-micro text-white/30">
                {t(DAY_LETTER_KEYS[date.getDay()])}
              </span>
              <span className="text-micro">{date.getDate()}</span>
              <span
                className={`h-1 w-1 rounded-full ${
                  hasEvent ? (isSelected ? 'bg-white' : 'bg-accent-blue') : ''
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};
