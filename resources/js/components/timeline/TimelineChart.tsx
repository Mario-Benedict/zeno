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
  openTaskId: string | null;
  onOpenCard: (task: TimelineTask) => void;
}

/** How long the card-detail panel's width transition takes to settle (see
 * CardDetailModal's `duration-300`) — the scroll-to-task effect waits this
 * long so it measures the chart's post-narrowing width, not its pre-open one. */
const CARD_PANEL_TRANSITION_MS = 320;

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
  openTaskId,
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

  // Opening a task's detail panel narrows this chart (the panel is a flex
  // sibling, not an overlay — see CardDetailModal), so the bar the user just
  // clicked can end up mostly hidden behind it. Pan so it's centred in
  // whatever width remains, mirroring how the Kanban card modal brings its
  // target into view. Waits for the panel's width transition to finish so it
  // measures the settled (post-narrowing) width, not the pre-open one.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !openTaskId) return;

    const task = tasks.find((t) => t.cardId === openTaskId);
    const geometry = task && getBarGeometry(task, display.start);
    if (!geometry) return;

    const timer = window.setTimeout(() => {
      const barCenter = geometry.left + geometry.width / 2;
      const target = Math.max(0, barCenter - el.clientWidth / 2);
      el.scrollTo({ left: target, behavior: 'smooth' });
    }, CARD_PANEL_TRANSITION_MS);

    return () => window.clearTimeout(timer);
  }, [openTaskId, tasks, display]);

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
