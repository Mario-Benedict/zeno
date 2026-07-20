import type { CSSProperties } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import type { TranslationKey } from '@/i18n/dictionary';
import CloseIcon from '@public/icons/small/cancel.svg';
import WidgetFrame from '../primitives/WidgetFrame';

// Copies the real CalendarWidget: a week strip (day letter + date, accent-blue
// selected pill, event dots) plus a compact day timeline where the two
// overlapping events sit side by side exactly as layoutDay places them.
type Day = {
  letter: TranslationKey;
  date: string;
  selected?: boolean;
  dot?: boolean;
};

const DAYS: Day[] = [
  { letter: 'calendar.dayLetterSun', date: '12' },
  { letter: 'calendar.dayLetterMon', date: '13' },
  { letter: 'calendar.dayLetterTue', date: '14', selected: true, dot: true },
  { letter: 'calendar.dayLetterWed', date: '15' },
  { letter: 'calendar.dayLetterThu', date: '16', dot: true },
  { letter: 'calendar.dayLetterFri', date: '17' },
  { letter: 'calendar.dayLetterSat', date: '18' },
];

const CalendarMockup = ({ className }: { className?: string }) => {
  const { t } = useTranslation();

  const pos = (top: number, height: number): CSSProperties => ({
    top: `${top}%`,
    height: `${height}%`,
  });

  return (
    <WidgetFrame
      title={t('nav.calendar')}
      actions={<CloseIcon className="h-3.5 w-3.5 text-white/40" />}
      className={`flex-1 ${className ?? ''}`}
    >
      {/* Week strip */}
      <div className="px-3">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xsmall font-semibold text-landing-app-fg">
            {t('landing.calendarMockup.range')}
          </span>
          <div className="flex gap-0.5 text-white/40">
            <span className="flex h-5 w-5 items-center justify-center rounded-full">
              ‹
            </span>
            <span className="flex h-5 w-5 items-center justify-center rounded-full">
              ›
            </span>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {DAYS.map((day, i) => (
            <div
              key={i}
              className={`flex flex-col items-center gap-0.5 rounded-lg py-1.5 ${
                day.selected
                  ? 'bg-accent-blue font-semibold text-white'
                  : 'text-white/80'
              }`}
            >
              <span
                className={`text-micro ${day.selected ? 'text-white/80' : 'text-white/30'}`}
              >
                {t(day.letter)}
              </span>
              <span className="text-micro">{day.date}</span>
              <span
                className={`h-1 w-1 rounded-full ${
                  day.dot ? (day.selected ? 'bg-white' : 'bg-accent-blue') : ''
                }`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Event count */}
      <div className="mt-1 border-t border-white/5 px-3 py-1.5 text-micro text-white/40">
        {t('landing.calendarMockup.eventCount')}
      </div>

      {/* Day timeline */}
      <div className="flex flex-1 px-3 pb-3">
        <div className="relative w-8 shrink-0">
          {['12 PM', '1 PM', '2 PM', '3 PM'].map((label, i) => (
            <span
              key={label}
              className="absolute right-1.5 -translate-y-1/2 text-micro whitespace-nowrap text-white/25"
              style={{ top: `${8 + i * 28}%` }}
            >
              {label}
            </span>
          ))}
        </div>

        <div className="relative flex-1 border-l border-white/5">
          {[8, 36, 64, 92].map((top) => (
            <div
              key={top}
              className="absolute inset-x-0 border-b border-white/5"
              style={{ top: `${top}%` }}
            />
          ))}

          {/* Now line */}
          <div
            className="absolute left-0 z-10 flex w-full items-center"
            style={{ top: '52%' }}
          >
            <span className="-ml-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-red" />
            <span className="h-px w-full bg-accent-red/60" />
          </div>

          {/* Two overlapping events, side by side */}
          <div
            className="absolute left-0 w-1/2 overflow-hidden rounded-md bg-accent-cyan px-1.5 py-0.5 text-landing-app-1"
            style={pos(38, 40)}
          >
            <span className="block truncate text-micro font-medium">
              {t('landing.calendarMockup.event1Name')}
            </span>
          </div>
          <div
            className="absolute right-0 w-1/2 overflow-hidden rounded-md bg-accent-purple px-1.5 py-0.5 text-white"
            style={pos(55, 33)}
          >
            <span className="block truncate text-micro font-medium">
              {t('landing.calendarMockup.event2Name')}
            </span>
          </div>
        </div>
      </div>
    </WidgetFrame>
  );
};

export default CalendarMockup;
