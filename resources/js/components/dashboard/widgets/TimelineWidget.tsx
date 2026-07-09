import { router } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useProject } from '@/hooks/useProject';
import { useTranslation } from '@/hooks/useTranslation';
import projects from '@/routes/projects';
import type { KanbanBoard } from '@/types/kanban';
import {
  buildDisplayRange,
  DAY_WIDTH,
  dateToX,
  flattenTasks,
  getBarGeometry,
  getDayCellLabel,
  getTaskAccentColor,
  getTimelineRange,
  isScheduled,
  isTaskOverdue,
  isToday,
  isWeekendDay,
  sortTasks,
} from '@/utils/timeline';
import { KanbanWidgetCardDetail } from './KanbanWidgetCardDetail';
import { WidgetSearchHeader } from './WidgetSearchHeader';

interface Props {
  kanbanBoards: KanbanBoard[];
}

// Compact row/bar geometry for the widget — horizontal spacing still comes
// from the shared `DAY_WIDTH` unit (via dateToX/getBarGeometry) so bars stay
// visually recognizable as "the same" timeline, just with a shorter, denser
// row layout than the full page's TimelineChart.
const ROW_HEIGHT = 36;
const BAR_HEIGHT = 24;
const BAR_TOP_OFFSET = (ROW_HEIGHT - BAR_HEIGHT) / 2;

/**
 * Compact, read-focused Gantt view for a dashboard slot — not the full
 * Timeline page. Deliberately built from scratch (not `components/timeline`)
 * so it can scale down to a small slot without the sort/filter menus, add-task
 * flow, or the page's larger row/bar sizing. Reuses the page's pure geometry
 * helpers (`@/utils/timeline`) for date math and, since a timeline task IS a
 * Kanban card, the same read-only card-detail popup and mark-done endpoint as
 * `KanbanWidget`.
 */
export const TimelineWidget = ({ kanbanBoards }: Props) => {
  const { project, accountIndex } = useProject();
  const { t } = useTranslation();
  const [boards, setBoards] = useState<KanbanBoard[]>(kanbanBoards);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);
  const [viewportWidth, setViewportWidth] = useState(0);
  const centeredRef = useRef(false);

  const allTasks = useMemo(() => flattenTasks(boards), [boards]);
  const scheduledTasks = useMemo(
    () => allTasks.filter(isScheduled),
    [allTasks],
  );
  const visibleTasks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const matching = query
      ? scheduledTasks.filter((task) =>
          task.title.toLowerCase().includes(query),
        )
      : scheduledTasks;

    return sortTasks(matching, 'start');
  }, [scheduledTasks, searchQuery]);

  const range = useMemo(() => getTimelineRange(visibleTasks), [visibleTasks]);

  // Track the scroll viewport width (monotonic max) so the grid can be
  // widened to fill it, mirroring TimelineChart's approach.
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
  const contentHeight = visibleTasks.length * ROW_HEIGHT;
  const todayCenterX = dateToX(new Date(), display.start) + DAY_WIDTH / 2;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || viewportWidth === 0 || centeredRef.current) return;
    el.scrollLeft = Math.max(0, todayCenterX - viewportWidth / 2);
    centeredRef.current = true;
  }, [viewportWidth, todayCenterX]);

  const selectedCard = selectedCardId
    ? (boards
        .flatMap((board) => board.cards ?? [])
        .find((card) => card.kanban_board_card_id === selectedCardId) ?? null)
    : null;

  const toggleDone = (cardId: string) => {
    let newValue = false;

    setBoards((prev) =>
      prev.map((board) => ({
        ...board,
        cards: board.cards?.map((card) => {
          if (card.kanban_board_card_id !== cardId) {
            return card;
          }
          newValue = !card.is_completed;
          return { ...card, is_completed: newValue };
        }),
      })),
    );

    router.patch(
      projects.kanban.cards.detail.update.url({
        accountIndex,
        project: project.project_slug,
        card: cardId,
      }),
      { is_completed: newValue },
      {
        preserveScroll: true,
        preserveState: true,
        onError: () => console.error('Failed to toggle card done'),
      },
    );
  };

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl bg-dark-surface-2">
      <WidgetSearchHeader
        title={t('dashboard.timelineTitle')}
        countLabel={t(
          visibleTasks.length === 1
            ? 'dashboard.taskCount'
            : 'dashboard.taskCountPlural',
          { count: visibleTasks.length },
        )}
        searchOpen={searchOpen}
        query={searchQuery}
        onQueryChange={setSearchQuery}
        onOpenSearch={() => setSearchOpen(true)}
        onCloseSearch={() => {
          setSearchOpen(false);
          setSearchQuery('');
        }}
        searchLabel={t('dashboard.searchTasks')}
        placeholder={t('dashboard.searchTasksPlaceholder')}
      />

      {scheduledTasks.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-4 text-center text-xsmall text-white/30">
          {t('dashboard.noScheduledTasks')}
        </div>
      ) : visibleTasks.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-4 text-center text-xsmall text-white/30">
          {t('dashboard.noTasksMatch')}
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="scrollbar-app relative min-h-0 flex-1 overflow-auto"
        >
          <div
            style={{ width: totalWidth }}
            className="flex min-h-full flex-col"
          >
            {/* Day axis */}
            <div className="sticky top-0 z-10 flex h-6 border-b border-dark-border bg-dark-surface-2">
              {display.days.map((day) => (
                <div
                  key={day.toISOString()}
                  style={{ width: DAY_WIDTH }}
                  className={`flex shrink-0 items-center justify-center border-r border-dark-border/30 text-micro ${
                    isWeekendDay(day) ? 'bg-white/[0.02]' : ''
                  } ${
                    isToday(day)
                      ? 'font-semibold text-accent-blue'
                      : 'text-dark-secondary'
                  }`}
                >
                  {getDayCellLabel(day)}
                </div>
              ))}
            </div>

            <div
              style={{ minHeight: contentHeight }}
              className="relative flex-1"
            >
              {/* Day grid + weekend shading */}
              {display.days.map((day, index) => (
                <div
                  key={day.toISOString()}
                  style={{ left: index * DAY_WIDTH, width: DAY_WIDTH }}
                  className={`absolute top-0 bottom-0 border-r border-dark-border/20 ${
                    isWeekendDay(day) ? 'bg-white/[0.015]' : ''
                  }`}
                />
              ))}

              {/* Today marker */}
              <div
                style={{ left: todayCenterX }}
                className="absolute top-0 bottom-0 z-[5] w-0.5 -translate-x-1/2 bg-accent-blue/70"
              />

              {/* Task bars */}
              {visibleTasks.map((task, index) => {
                const geometry = getBarGeometry(task, display.start);
                if (!geometry) return null;

                const accent = getTaskAccentColor(task);
                const overdue = isTaskOverdue(task);

                return (
                  <div
                    key={task.cardId}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedCardId(task.cardId)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedCardId(task.cardId);
                      }
                    }}
                    style={{
                      left: geometry.left,
                      top: index * ROW_HEIGHT + BAR_TOP_OFFSET,
                      width: geometry.width,
                      height: BAR_HEIGHT,
                      borderLeftColor: accent,
                    }}
                    className={`absolute flex cursor-pointer items-center overflow-hidden rounded-md border border-l-[3px] bg-dark-surface-3 px-2 transition hover:-translate-y-px ${
                      overdue
                        ? 'border-accent-red/40 ring-1 ring-accent-red/40'
                        : 'border-dark-border'
                    } ${task.isCompleted ? 'opacity-60' : ''}`}
                    title={task.title}
                  >
                    <span
                      className={`truncate text-micro font-semibold text-white ${
                        task.isCompleted ? 'line-through' : ''
                      }`}
                    >
                      {task.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {selectedCard && (
        <KanbanWidgetCardDetail
          card={selectedCard}
          onClose={() => setSelectedCardId(null)}
          onToggleDone={toggleDone}
        />
      )}
    </div>
  );
};
