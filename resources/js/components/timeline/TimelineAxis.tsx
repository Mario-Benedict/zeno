import type { TimelineRange } from '@/utils/timeline';
import {
  DAY_WIDTH,
  getDayCellLabel,
  getMonthSegments,
  isToday,
  isWeekendDay,
} from '@/utils/timeline';

interface TimelineAxisProps {
  range: TimelineRange;
}

/**
 * The sticky time ruler: a month band on top ("April 2026") and a per-day
 * band below ("M 13"). Sized from the same `DAY_WIDTH` unit as the bars so the
 * two stay aligned as the chart scrolls horizontally.
 */
export const TimelineAxis = ({ range }: TimelineAxisProps) => {
  const monthSegments = getMonthSegments(range.days);

  return (
    <div className="sticky top-0 z-20 bg-dark-surface-1">
      {/* Month band */}
      <div className="relative h-7 border-b border-dark-border">
        {monthSegments.map((segment) => (
          <div
            key={segment.key}
            style={{ left: segment.left, width: segment.width }}
            className="absolute top-0 flex h-full items-center px-2 text-xsmall font-semibold text-dark-primary"
          >
            <span className="sticky left-2 truncate">{segment.label}</span>
          </div>
        ))}
      </div>

      {/* Day band */}
      <div className="flex h-9 border-b-2 border-dark-border">
        {range.days.map((day) => {
          const today = isToday(day);

          return (
            <div
              key={day.toISOString()}
              style={{ width: DAY_WIDTH }}
              className={`flex shrink-0 flex-col items-center justify-center border-r border-dark-border/40 text-xsmall ${
                isWeekendDay(day) ? 'bg-white/[0.02]' : ''
              } ${today ? 'font-semibold text-accent-blue' : 'text-dark-secondary'}`}
            >
              <span>{getDayCellLabel(day)}</span>
              {today && (
                <span className="mt-0.5 h-0.5 w-5 rounded-full bg-accent-blue" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
