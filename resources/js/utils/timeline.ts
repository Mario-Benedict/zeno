import {
  addDays,
  differenceInCalendarDays,
  eachDayOfInterval,
  format,
  isWeekend,
  max,
  startOfDay,
  startOfWeek,
} from 'date-fns';
import type { KanbanBoard } from '@/types/kanban';
import type {
  TimelineFilters,
  TimelineSortKey,
  TimelineTask,
} from '@/types/timeline';

// ─── Layout constants ────────────────────────────────────────────────────────
// The whole chart is laid out from a single "pixels per day" unit so the axis
// header and the bars stay perfectly aligned.

export const DAY_WIDTH = 56;
export const ROW_HEIGHT = 84;
export const BAR_HEIGHT = 60;
/** Days of breathing room added on each side of the task span. */
export const RANGE_PADDING_DAYS = 4;

// ─── Date parsing ────────────────────────────────────────────────────────────

/**
 * Parse a stored card date (UTC ISO datetime string) into a local calendar
 * day. The string must be converted through a real Date first so the UTC
 * instant resolves to the viewer's local day — slicing the ISO string's date
 * portion directly reads the *UTC* day, which is one day off for any viewer
 * whose local day differs from the UTC day (e.g. evening events in positive
 * UTC offsets). Mirrors the local-getters approach `CardDetailSidebar.tsx`
 * and `CardDetailBody.tsx` use, so the timeline agrees with the card modal.
 */
export const parseCardDate = (iso: string | null | undefined): Date | null => {
  if (!iso || typeof iso !== 'string') return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;

  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

// ─── Flattening boards → tasks ───────────────────────────────────────────────

/**
 * Flatten the Kanban board tree into a flat list of timeline tasks. Every
 * card is included (even undated ones); callers decide which subset to render.
 */
export const flattenTasks = (boards: KanbanBoard[]): TimelineTask[] => {
  const tasks: TimelineTask[] = [];

  boards.forEach((board, boardIndex) => {
    (board.cards ?? []).forEach((card) => {
      tasks.push({
        cardId: card.kanban_board_card_id,
        boardId: board.kanban_board_id,
        boardName: board.kanban_board_name,
        boardPosition: board.kanban_board_position ?? boardIndex,
        title: card.kanban_board_card_title,
        isCompleted: card.is_completed,
        start: parseCardDate(card.kanban_board_card_start_date),
        due: parseCardDate(card.kanban_board_card_due_date),
        labels: card.labels ?? [],
        members: card.members ?? [],
        card,
      });
    });
  });

  return tasks;
};

/** A task is renderable on the timeline once it has at least one date. */
export const isScheduled = (task: TimelineTask): boolean =>
  task.start !== null || task.due !== null;

// ─── Range + axis ────────────────────────────────────────────────────────────

export interface TimelineRange {
  start: Date;
  end: Date;
  days: Date[];
}

/**
 * Compute the visible date window from the scheduled tasks. Always includes
 * "today" so the current-day marker is on screen, and falls back to a window
 * around today when there is nothing scheduled yet.
 */
export const getTimelineRange = (tasks: TimelineTask[]): TimelineRange => {
  const today = startOfDay(new Date());
  const points: Date[] = [today];

  tasks.forEach((task) => {
    if (task.start) points.push(task.start);
    if (task.due) points.push(task.due);
  });

  let min = points[0];
  let max = points[0];
  points.forEach((d) => {
    if (d < min) min = d;
    if (d > max) max = d;
  });

  // Snap the start to the beginning of its week for a tidy header, then pad.
  const start = startOfWeek(addDays(min, -RANGE_PADDING_DAYS), {
    weekStartsOn: 1,
  });
  const end = addDays(max, RANGE_PADDING_DAYS);

  return { start, end, days: eachDayOfInterval({ start, end }) };
};

/**
 * Widen the data-driven range so the grid always reaches at least a full
 * screen past "today" — keeping the today marker reachable and giving the
 * chart room to scroll forward. The *start* stays anchored to `base.start`
 * (already task-driven, see `getTimelineRange`) rather than also padding
 * backward to fill the viewport: doing that used to open the chart on a wall
 * of empty days before the first scheduled task whenever today sat far from
 * it. Returns the base range untouched until the viewport has been measured
 * (width 0).
 */
export const buildDisplayRange = (
  base: TimelineRange,
  viewportWidth: number,
): TimelineRange => {
  if (viewportWidth <= 0) return base;

  const today = startOfDay(new Date());
  const cols = Math.ceil(viewportWidth / DAY_WIDTH) + 2;
  const end = max([base.end, addDays(today, cols)]);

  return {
    start: base.start,
    end,
    days: eachDayOfInterval({ start: base.start, end }),
  };
};

/** Horizontal offset (px) of the left edge of a given day. */
export const dateToX = (date: Date, rangeStart: Date): number =>
  differenceInCalendarDays(startOfDay(date), rangeStart) * DAY_WIDTH;

export interface BarGeometry {
  left: number;
  width: number;
}

/**
 * Pixel geometry for a task's bar. Bars are anchored to the *centre* of their
 * start day, so a task beginning "today" lines up exactly with the centred
 * today marker and the day label above it. A task with only one of the two
 * dates is rendered as a single-day bar at that date.
 */
export const getBarGeometry = (
  task: TimelineTask,
  rangeStart: Date,
): BarGeometry | null => {
  const start = task.start ?? task.due;
  const end = task.due ?? task.start;
  if (!start || !end) return null;

  const left = dateToX(start, rangeStart) + DAY_WIDTH / 2;
  const spanDays = differenceInCalendarDays(end, start) + 1;
  const width = Math.max(spanDays, 1) * DAY_WIDTH;

  return { left, width };
};

export interface MonthSegment {
  key: string;
  label: string;
  left: number;
  width: number;
}

/** Group the day cells into contiguous month segments for the header row. */
export const getMonthSegments = (days: Date[]): MonthSegment[] => {
  const segments: MonthSegment[] = [];

  days.forEach((day, index) => {
    const key = format(day, 'yyyy-MM');
    const last = segments[segments.length - 1];
    if (last && last.key === key) {
      last.width += DAY_WIDTH;
    } else {
      segments.push({
        key,
        label: format(day, 'MMMM yyyy'),
        left: index * DAY_WIDTH,
        width: DAY_WIDTH,
      });
    }
  });

  return segments;
};

/** Weekday-initial + day-of-month label for a single axis cell, e.g. "M 13". */
export const getDayCellLabel = (day: Date): string =>
  `${format(day, 'EEEEE')} ${format(day, 'd')}`;

export const isWeekendDay = (day: Date): boolean => isWeekend(day);

export const isToday = (day: Date): boolean =>
  differenceInCalendarDays(startOfDay(day), startOfDay(new Date())) === 0;

/** True when a task's due date has passed and it isn't marked done. */
export const isTaskOverdue = (task: TimelineTask): boolean => {
  if (!task.due || task.isCompleted) return false;
  return differenceInCalendarDays(task.due, startOfDay(new Date())) < 0;
};

// ─── Priority ────────────────────────────────────────────────────────────────
// Priority is inferred from a card's labels — first by well-known priority
// names, then by "colour warmth" (red = hottest) so sorting by priority works
// even when labels are only distinguished by colour, per the design spec.

const PRIORITY_NAME_RANK: Record<string, number> = {
  urgent: 4,
  critical: 4,
  high: 3,
  medium: 2,
  normal: 2,
  low: 1,
  easy: 1,
};

const COLOR_WARMTH_RANK: Record<string, number> = {
  '#D32F2F': 3, // red
  '#F57C00': 2, // orange
  '#FBC02D': 2, // yellow
  '#C2185B': 2, // pink
};

export const getPriorityRank = (task: TimelineTask): number => {
  let rank = 0;
  task.labels.forEach((label) => {
    const nameRank =
      PRIORITY_NAME_RANK[label.card_label_name.toLowerCase()] ?? 0;
    const colorRank = label.card_label_color_hex
      ? (COLOR_WARMTH_RANK[label.card_label_color_hex.toUpperCase()] ?? 0)
      : 0;
    rank = Math.max(rank, nameRank, colorRank);
  });
  return rank;
};

/** The accent colour for a task's bar — its first label, or a neutral blue. */
export const getTaskAccentColor = (task: TimelineTask): string =>
  task.labels.find((l) => l.card_label_color_hex)?.card_label_color_hex ??
  '#3949AB';

// ─── Filter + sort ───────────────────────────────────────────────────────────

/**
 * Keep tasks matching every active filter category. Within a category the
 * match is OR (any selected label/member/board), across categories it is AND.
 */
export const filterTasks = (
  tasks: TimelineTask[],
  filters: TimelineFilters,
  searchQuery: string,
): TimelineTask[] => {
  const query = searchQuery.trim().toLowerCase();

  return tasks.filter((task) => {
    if (query && !task.title.toLowerCase().includes(query)) return false;

    if (
      filters.labelIds.length > 0 &&
      !task.labels.some((l) => filters.labelIds.includes(l.card_label_id))
    ) {
      return false;
    }

    if (
      filters.memberIds.length > 0 &&
      !task.members.some((m) => filters.memberIds.includes(m.id))
    ) {
      return false;
    }

    if (
      filters.boardIds.length > 0 &&
      !filters.boardIds.includes(task.boardId)
    ) {
      return false;
    }

    return true;
  });
};

const startTime = (task: TimelineTask): number =>
  (task.start ?? task.due)?.getTime() ?? Number.POSITIVE_INFINITY;

/** Sort rows vertically. Undated tasks always sink to the bottom. */
export const sortTasks = (
  tasks: TimelineTask[],
  sortKey: TimelineSortKey,
): TimelineTask[] => {
  const sorted = [...tasks];

  sorted.sort((a, b) => {
    if (sortKey === 'priority') {
      const diff = getPriorityRank(b) - getPriorityRank(a);
      if (diff !== 0) return diff;
    }
    const startDiff = startTime(a) - startTime(b);
    if (startDiff !== 0) return startDiff;
    return a.title.localeCompare(b.title);
  });

  return sorted;
};
