import { useEffect, useMemo, useRef, useState } from 'react';
import type { TimelineTask } from '@/types/timeline';
import type { TimelineRange } from '@/utils/timeline';
import {
  BAR_HEIGHT,
  buildDisplayRange,
  DAY_WIDTH,
  dateToX,
  getBarGeometry,
  isWeekendDay,
  ROW_HEIGHT,
} from '@/utils/timeline';
import { TimelineAxis } from './TimelineAxis';
import { TimelineBar } from './TimelineBar';

interface TimelineChartProps {
  tasks: TimelineTask[];
  range: TimelineRange;
  onOpenCard: (task: TimelineTask) => void;
}

const BAR_TOP_OFFSET = (ROW_HEIGHT - BAR_HEIGHT) / 2;

/**
 * The scrollable timeline canvas: a sticky axis on top, a weekend-shaded day
 * grid, a centred "today" marker, and one absolutely-positioned bar per task
 * row. The grid is widened to fill the viewport (and beyond) so it always
 * reaches the right and bottom edges while staying scrollable both ways.
 */
export const TimelineChart = ({
  tasks,
  range,
  onOpenCard,
}: TimelineChartProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [viewportWidth, setViewportWidth] = useState(0);
  const centeredRef = useRef(false);

  // Track the scroll viewport width (monotonic max) so the grid can be widened
  // to fill it. Keeping it monotonic means opening the card panel — which
  // momentarily narrows the chart — never reflows the bars, so the transition
  // stays smooth.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const measure = () => setViewportWidth((w) => Math.max(w, el.clientWidth));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const display = useMemo(
    () => buildDisplayRange(range, viewportWidth),
    [range, viewportWidth],
  );

  const totalWidth = display.days.length * DAY_WIDTH;
  const contentHeight = tasks.length * ROW_HEIGHT;
  // Centre of today's column — both the marker and the initial scroll sit here.
  const todayCenterX = dateToX(new Date(), display.start) + DAY_WIDTH / 2;

  // Once the viewport is measured, scroll so "today" sits in the centre.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || viewportWidth === 0 || centeredRef.current) return;
    el.scrollLeft = Math.max(0, todayCenterX - viewportWidth / 2);
    centeredRef.current = true;
  }, [viewportWidth, todayCenterX]);

  return (
    <div
      ref={scrollRef}
      className="scrollbar-app relative flex-1 overflow-auto bg-dark-surface-1"
    >
      <div style={{ width: totalWidth }} className="flex min-h-full flex-col">
        <TimelineAxis range={display} />

        <div style={{ minHeight: contentHeight }} className="relative flex-1">
          {/* Day grid + weekend shading */}
          {display.days.map((day, index) => (
            <div
              key={day.toISOString()}
              style={{ left: index * DAY_WIDTH, width: DAY_WIDTH }}
              className={`absolute top-0 bottom-0 border-r border-dark-border/25 ${
                isWeekendDay(day) ? 'bg-white/[0.015]' : ''
              }`}
            />
          ))}

          {/* Today marker — centred in today's column */}
          <div
            style={{ left: todayCenterX }}
            className="absolute top-0 bottom-0 z-10 w-0.5 -translate-x-1/2 bg-accent-blue/70"
          />

          {/* Task bars */}
          {tasks.map((task, index) => {
            const geometry = getBarGeometry(task, display.start);
            if (!geometry) return null;
            return (
              <TimelineBar
                key={task.cardId}
                task={task}
                left={geometry.left}
                width={geometry.width}
                top={index * ROW_HEIGHT + BAR_TOP_OFFSET}
                onOpenCard={onOpenCard}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
