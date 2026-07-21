import { Head, router } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AddCardModal, CardDetailModalWrapper } from '@/components/kanban';
import { TimelineChart, TimelineHeader } from '@/components/timeline';
import echo from '@/echo';
import { useProject } from '@/hooks/useProject';
import { useTranslation } from '@/hooks/useTranslation';
import AppLayout from '@/layouts/AppLayout';
import projects from '@/routes/projects';
import type {
  CreateKanbanCardInput,
  KanbanBoard,
  KanbanBoardCard,
} from '@/types/kanban';
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
  const { accountIndex, projectRole } = useProject();
  const { t } = useTranslation();
  const canEdit =
    projectRole === 'OWNER' ||
    projectRole === 'ADMIN' ||
    projectRole === 'MEMBER';
  const [boards, setBoards] = useState<KanbanBoard[]>(kanbanBoards);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<TimelineFilters>(EMPTY_FILTERS);
  const [sortKey, setSortKey] = useState<TimelineSortKey>('start');
  const [addingTask, setAddingTask] = useState(false);
  const [openCard, setOpenCard] = useState<{
    card: KanbanBoardCard;
    boardId: string;
  } | null>(null);
  const optimisticAttachmentUrlsRef = useRef(new Set<string>());

  useEffect(() => {
    const optimisticAttachmentUrls = optimisticAttachmentUrlsRef.current;

    return () => {
      optimisticAttachmentUrls.forEach((url) => URL.revokeObjectURL(url));
      optimisticAttachmentUrls.clear();
    };
  }, []);

  // Keep local board state in sync whenever the server-provided prop changes,
  // whether from our own writes' full-page reloads or a realtime refresh.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBoards(kanbanBoards);
  }, [kanbanBoards]);

  // Any card due-date/assignment change elsewhere (Kanban board, card modal,
  // another member) broadcasts on this project's calendar channel — reuse it
  // here so the timeline chart stays live without a manual refresh.
  useEffect(() => {
    const channelName = `calendar.project.${project.project_id}`;
    const channel = echo.private(channelName);
    const onChanged = () => {
      router.reload({ only: ['kanbanBoards'] });
    };

    channel.listen('.calendar.changed', onChanged);

    return () => {
      channel.stopListening('.calendar.changed', onChanged);
      echo.leave(channelName);
    };
  }, [project.project_id]);

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

  // Card creation reuses the Kanban endpoint and keeps the complete modal
  // payload in the optimistic row, including its initial checklist and files.
  const handleAddCard = async (input: CreateKanbanCardInput) => {
    if (!canEdit) return;

    const {
      boardId,
      title,
      description,
      startAt,
      dueAt,
      labelIds,
      memberIds,
      checklist,
      attachments,
    } = input;
    const cardId = crypto.randomUUID();
    const now = new Date().toISOString();

    const selectedLabels = (cardLabels || []).filter((l) =>
      labelIds.includes(l.card_label_id),
    );
    const optimisticAttachmentUrls = attachments.map((attachment) =>
      URL.createObjectURL(attachment.file),
    );
    optimisticAttachmentUrls.forEach((url) =>
      optimisticAttachmentUrlsRef.current.add(url),
    );

    const optimisticCard: KanbanBoardCard = {
      kanban_board_card_id: cardId,
      kanban_board_id: boardId,
      kanban_board_card_title: title,
      kanban_board_card_description: description,
      is_completed: false,
      kanban_board_card_start_date: startAt,
      kanban_board_card_due_date: dueAt,
      labels: selectedLabels,
      members: projectUsers.filter((member) => memberIds.includes(member.id)),
      checklists: checklist
        ? [
            {
              kanban_board_card_checklist_id: checklist.id,
              kanban_board_card_id: cardId,
              kanban_board_card_checklist_name: checklist.name,
              items: checklist.items.map((item) => ({
                kanban_board_card_checklist_item_id: item.id,
                kanban_board_card_checklist_id: checklist.id,
                kanban_board_card_checklist_item_name: item.name,
                is_completed: false,
                created_at: now,
                updated_at: now,
              })),
              created_at: now,
              updated_at: now,
            },
          ]
        : [],
      attachments: attachments.map((attachment, index) => ({
        kanban_board_card_attachment_id: attachment.id,
        kanban_board_card_id: cardId,
        kanban_board_card_attachment_name: attachment.file.name,
        kanban_board_card_attachment_url: optimisticAttachmentUrls[index],
        created_at: now,
        updated_at: now,
      })),
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

    return new Promise<void>((resolve) => {
      router.post(
        projects.kanban.boards.board.cards.store.url({
          accountIndex,
          project: project.project_slug,
          board: boardId,
        }),
        {
          kanban_board_card_id: cardId,
          title,
          description,
          kanban_board_card_start_date: startAt,
          kanban_board_card_due_date: dueAt,
          label_ids: labelIds,
          member_ids: memberIds,
          checklist: checklist
            ? {
                id: checklist.id,
                name: checklist.name,
                items: checklist.items.map((item) => ({
                  id: item.id,
                  name: item.name,
                })),
              }
            : null,
          attachments: attachments.map((attachment) => ({
            id: attachment.id,
            file: attachment.file,
          })),
        },
        {
          ...inertiaWriteOptions,
          forceFormData: attachments.length > 0,
          onSuccess: () => {
            setAddingTask(false);
            setOpenCard({ card: optimisticCard, boardId });
          },
          onError: (errors) => {
            optimisticAttachmentUrls.forEach((url) => {
              URL.revokeObjectURL(url);
              optimisticAttachmentUrlsRef.current.delete(url);
            });
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
            console.error('Failed to add card', errors);
            alert(t('timeline.failedToCreateTask'));
          },
          onFinish: () => resolve(),
        },
      );
    });
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
          showAddTask={canEdit}
          canAddTask={canEdit && boards.length > 0}
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
              canEdit={canEdit}
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

      {canEdit && addingTask && (
        <AddCardModal
          boards={boards}
          cardLabels={cardLabels}
          projectUsers={projectUsers}
          defaultBoardId={defaultBoardId}
          onClose={() => setAddingTask(false)}
          onSubmit={handleAddCard}
        />
      )}
    </AppLayout>
  );
};

export default Timeline;
