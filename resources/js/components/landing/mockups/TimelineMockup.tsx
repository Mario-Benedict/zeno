import { useTranslation } from '@/hooks/useTranslation';
import type { TranslationKey } from '@/i18n/dictionary';
import WidgetFrame from '../primitives/WidgetFrame';

// Copies the real TimelineWidget: a day axis (weekday letter + date) with
// weekend shading and a "today" marker, and one bar per task — surface-3 with an
// accent left border — inside the shared widget frame.
type Day = {
  letter: TranslationKey;
  date: string;
  today?: boolean;
  weekend?: boolean;
};

const DAYS: Day[] = [
  { letter: 'calendar.dayLetterSat', date: '11', weekend: true },
  { letter: 'calendar.dayLetterSun', date: '12', weekend: true },
  { letter: 'calendar.dayLetterMon', date: '13' },
  { letter: 'calendar.dayLetterTue', date: '14', today: true },
  { letter: 'calendar.dayLetterWed', date: '15' },
  { letter: 'calendar.dayLetterThu', date: '16' },
  { letter: 'calendar.dayLetterFri', date: '17' },
  { letter: 'calendar.dayLetterSat', date: '18', weekend: true },
];

const TODAY_INDEX = 3;

const TimelineMockup = ({ className }: { className?: string }) => {
  const { t } = useTranslation();

  const bars = [
    {
      title: t('landing.bentoMockup.timelineTask1'),
      border: 'border-l-accent-red',
      left: 44,
      width: 52,
    },
    {
      title: t('landing.bentoMockup.timelineTask2'),
      border: 'border-l-accent-yellow',
      left: 56,
      width: 40,
    },
  ];

  const todayLeft = ((TODAY_INDEX + 0.5) / DAYS.length) * 100;

  return (
    <WidgetFrame
      title={t('dashboard.timelineTitle')}
      count={t('landing.bentoMockup.timelineCount')}
      className={`flex-1 ${className ?? ''}`}
    >
      {/* Day axis */}
      <div className="flex h-6 shrink-0 border-y border-landing-app-line">
        {DAYS.map((day, i) => (
          <div
            key={i}
            className={`flex flex-1 items-center justify-center border-r border-landing-app-line/30 text-micro ${
              day.weekend ? 'bg-white/2' : ''
            } ${day.today ? 'font-semibold text-accent-blue' : 'text-landing-app-sub'}`}
          >
            {t(day.letter)} {day.date}
          </div>
        ))}
      </div>

      {/* Rows */}
      <div className="relative flex-1 py-1">
        <div className="pointer-events-none absolute inset-0 flex">
          {DAYS.map((day, i) => (
            <div
              key={i}
              className={`flex-1 border-r border-landing-app-line/20 ${day.weekend ? 'bg-white/[0.015]' : ''}`}
            />
          ))}
        </div>
        <div
          className="pointer-events-none absolute inset-y-0 z-10 w-0.5 -translate-x-1/2 bg-accent-blue/70"
          style={{ left: `${todayLeft}%` }}
        />

        {bars.map((bar) => (
          <div key={bar.title} className="relative flex h-9 items-center">
            <div
              className={`absolute flex items-center overflow-hidden rounded-md border border-l-4 border-landing-app-line bg-landing-app-3 px-2 py-1 ${bar.border}`}
              style={{ left: `${bar.left}%`, width: `${bar.width}%` }}
            >
              <span className="truncate text-micro font-semibold text-white">
                {bar.title}
              </span>
            </div>
          </div>
        ))}
      </div>
    </WidgetFrame>
  );
};

export default TimelineMockup;
