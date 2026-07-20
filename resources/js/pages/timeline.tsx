import { Head, router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { AddCardModal, CardDetailModalWrapper } from '@/components/kanban';
import { TimelineChart, TimelineHeader } from '@/components/timeline';
import { useTranslation } from '@/hooks/useTranslation';
import AppLayout from '@/layouts/AppLayout';
import projects from '@/routes/projects';
import type { KanbanBoard, KanbanBoardCard } from '@/types/kanban';
import type {
  TimelineFilters,
  TimelineProps,
  TimelineSortKey,
} from '@/types/timeline';
import {
  filterTasks,
  flattenTasks,
  getTimelineRange,
  isScheduled,
  sortTasks,
} from '@/utils/timeline';

// The timeline runs its own optimistic updates, so — exactly like the Kanban
// page and card modal — writes preserve scroll + state and only surface
// server-side failures.
const inertiaWriteOptions = {
  preserveScroll: true,
  preserveState: true,
} as const;

const EMPTY_FILTERS: TimelineFilters = {
  labelIds: [],
  memberIds: [],
  boardIds: [],
};

const Timeline = ({
  project,
  kanbanBoards,
  cardLabels,
  projectUsers,
  currentUser,
}: TimelineProps) => {
  const accountIndex = usePage().props.account.index;
  const { t } = useTranslation();
  const [boards, setBoards] = useState<KanbanBoard[]>(kanbanBoards);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<TimelineFilters>(EMPTY_FILTERS);
  const [sortKey, setSortKey] = useState<TimelineSortKey>('start');
  const [addingTask, setAddingTask] = useState(false);
  const [openCard, setOpenCard] = useState<{
    card: KanbanBoardCard;
    boardId: string;
  } | null>(null);

  // Flatten the board tree, then derive the filtered + sorted list of rows and
  // the visible date window. All layout maths downstream reads from `range`.
  const allTasks = useMemo(() => flattenTasks(boards), [boards]);
  const scheduledTasks = useMemo(
    () => allTasks.filter(isScheduled),
    [allTasks],
  );
  const visibleTasks = useMemo(
    () => sortTasks(filterTasks(scheduledTasks, filters, searchQuery), sortKey),
    [scheduledTasks, filters, searchQuery, sortKey],
  );
  const range = useMemo(() => getTimelineRange(visibleTasks), [visibleTasks]);

  const defaultBoardId = boards[0]?.kanban_board_id ?? '';
  const hasAnyScheduled = scheduledTasks.length > 0;

  // ── Reused Kanban write flows ──────────────────────────────────────────────

  // Card creation is 100% the Kanban flow: same optimistic insert, same
  // payload, same `boards.board.cards.store` endpoint. After inserting we open
  // the reused card-detail modal so the brand-new (still undated) task can be
  // given its start / due dates right away and appear on the timeline.
  const handleAddCard = async (
    boardId: string,
    title: string,
    labelIds: string[],
  ) => {
    const cardId = crypto.randomUUID();
    const now = new Date().toISOString();

    const selectedLabels = (cardLabels || []).filter((l) =>
      labelIds.includes(l.card_label_id),
    );

    const optimisticCard: KanbanBoardCard = {
      kanban_board_card_id: cardId,
      kanban_board_id: boardId,
      kanban_board_card_title: title,
      kanban_board_card_description: null,
      is_completed: false,
      kanban_board_card_start_date: null,
      kanban_board_card_due_date: null,
      labels: selectedLabels,
      members: [],
      checklists: [],
      attachments: [],
      comments: [],
      created_at: now,
      updated_at: now,
    };

    setBoards((prev) =>
      prev.map((b) =>
        b.kanban_board_id !== boardId
          ? b
          : { ...b, cards: [...(b.cards || []), optimisticCard] },
      ),
    );
    setAddingTask(false);
    setOpenCard({ card: optimisticCard, boardId });

    router.post(
      projects.kanban.boards.board.cards.store.url({
        accountIndex,
        project: project.project_slug,
        board: boardId,
      }),
      {
        kanban_board_card_id: cardId,
        title,
        label_ids: labelIds,
      },
      {
        ...inertiaWriteOptions,
        onError: (errors) => {
          setBoards((prev) =>
            prev.map((b) =>
              b.kanban_board_id !== boardId
                ? b
                : {
                    ...b,
                    cards: b.cards?.filter(
                      (c) => c.kanban_board_card_id !== cardId,
                    ),
                  },
            ),
          );
          setOpenCard(null);
          console.error('Failed to add card', errors);
          alert(t('timeline.failedToCreateTask'));
        },
      },
    );
  };

  // Merge an update coming back from the reused Kanban card-detail modal.
  const handleCardUpdate = (
    updatedCard: KanbanBoardCard,
    targetBoardId: string,
  ) => {
    setBoards((prev) =>
      prev.map((board) => {
        if (board.kanban_board_id === targetBoardId) {
          return {
            ...board,
            cards: board.cards?.map((c) =>
              c.kanban_board_card_id === updatedCard.kanban_board_card_id
                ? updatedCard
                : c,
            ),
          };
        }
        return {
          ...board,
          cards: board.cards?.filter(
            (c) => c.kanban_board_card_id !== updatedCard.kanban_board_card_id,
          ),
        };
      }),
    );
    if (
      openCard?.card.kanban_board_card_id === updatedCard.kanban_board_card_id
    ) {
      setOpenCard({ card: updatedCard, boardId: targetBoardId });
    }
  };

  return (
    <AppLayout project={project}>
      <Head title={`${t('nav.timeline')} - ${project.project_name}`} />

      <div className="flex h-full w-full min-w-0 flex-col overflow-hidden bg-dark-surface-1">
        <TimelineHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filters={filters}
          onFiltersChange={setFilters}
          sortKey={sortKey}
          onSortChange={setSortKey}
          cardLabels={cardLabels}
          projectUsers={projectUsers}
          boards={boards}
          canAddTask={boards.length > 0}
          onAddTask={() => setAddingTask(true)}
        />

        {/* Card panel and chart share this row so opening a card only narrows
            the chart below — the header above always stays full width and
            its buttons stay clickable. */}
        <div className="flex min-h-0 flex-1">
          {openCard && (
            <CardDetailModalWrapper
              isOpen={true}
              card={openCard.card}
              boardId={openCard.boardId}
              cardLabels={cardLabels}
              projectUsers={projectUsers}
              currentUser={currentUser}
              project={project}
              onClose={() => setOpenCard(null)}
              onUpdate={handleCardUpdate}
            />
          )}

          <div className="relative m-2 mt-0 flex min-h-0 flex-1 overflow-hidden rounded-lg border border-dark-border">
            <TimelineChart
              tasks={visibleTasks}
              range={range}
              openTaskId={openCard?.card.kanban_board_card_id ?? null}
              onOpenCard={(task) =>
                setOpenCard({ card: task.card, boardId: task.boardId })
              }
            />

            {visibleTasks.length === 0 && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6 text-center">
                <p className="max-w-xs text-small text-dark-secondary">
                  {hasAnyScheduled
                    ? t('timeline.noTasksMatchFilters')
                    : t('timeline.noScheduledTasks')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {addingTask && (
        <AddCardModal
          boards={boards}
          cardLabels={cardLabels}
          defaultBoardId={defaultBoardId}
          onClose={() => setAddingTask(false)}
          onSubmit={handleAddCard}
        />
      )}
    </AppLayout>
  );
};

export default Timeline;
