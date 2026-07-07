import type { DropResult } from '@hello-pangea/dnd';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { Head, router, usePage } from '@inertiajs/react';
import { useRef, useState } from 'react';
import {
  KanbanColumn,
  CardDetailModalWrapper,
  AddCardModal,
  AddBoardInput,
} from '@/components/kanban';
import AppLayout from '@/layouts/AppLayout';
import projects from '@/routes/projects';
import type { KanbanBoardCard, KanbanBoard, KanbanProps } from '@/types/kanban';
import AddIcon from '@public/icons/small/plus.svg';
import SearchIcon from '@public/icons/small/search.svg';

// All write operations in this page use Inertia's `router` instead of raw
// `fetch()`. Each controller returns `back()` so Inertia replays the current
// page, and we keep the optimistic local state by passing `preserveState`
// and `preserveScroll`.
const inertiaWriteOptions = {
  preserveScroll: true,
  preserveState: true,
} as const;

// Sends a PATCH directly via fetch, bypassing Inertia's page lifecycle so
// the response never triggers a re-render. Used for drag moves where any
// extra render during the drop animation causes a visible flinch.
const silentPatch = (
  url: string,
  data: Record<string, unknown>,
  signal?: AbortSignal,
) =>
  fetch(url, {
    method: 'PATCH',
    redirect: 'manual',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-TOKEN':
        document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
          ?.content ?? '',
    },
    body: JSON.stringify(data),
    signal,
  }).catch((err: unknown) => {
    if ((err as Error).name !== 'AbortError') {
      console.error('Failed to persist move:', err);
    }
  });

export default function Kanban({
  project,
  kanbanBoards,
  projectUsers,
  currentUser,
  cardLabels,
}: KanbanProps) {
  const accountIndex = usePage().props.account.index;
  const [boards, setBoards] = useState<KanbanBoard[]>(kanbanBoards);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalBoardId, setModalBoardId] = useState<string | null>(null);
  const [addingBoard, setAddingBoard] = useState(false);
  const [openCard, setOpenCard] = useState<{
    card: KanbanBoardCard;
    boardId: string;
  } | null>(null);

  // One abort controller per drag type — cancels the previous in-flight
  // request when a new move arrives, so only the latest position persists.
  const cardMoveAbortRef = useRef<AbortController | null>(null);
  const boardMoveAbortsRef = useRef<AbortController[]>([]);

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId, type } = result;

    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    // Handle column reordering
    if (type === 'BOARD') {
      const next = [...boards];
      const [movedBoard] = next.splice(source.index, 1);
      next.splice(destination.index, 0, movedBoard);
      setBoards(next);

      // Cancel previous board-move requests and queue fresh ones
      boardMoveAbortsRef.current.forEach((c) => c.abort());
      const ctrls: AbortController[] = [];
      const oldPositions = new Map(
        boards.map((b, i) => [b.kanban_board_id, i]),
      );
      next.forEach((board, idx) => {
        if (oldPositions.get(board.kanban_board_id) !== idx) {
          const ctrl = new AbortController();
          ctrls.push(ctrl);
          silentPatch(
            projects.kanban.boards.board.update.url({
              accountIndex,
              project: project.project_slug,
              board: board.kanban_board_id,
            }),
            { position: idx },
            ctrl.signal,
          );
        }
      });
      boardMoveAbortsRef.current = ctrls;
      return;
    }

    // Handle card reordering
    const next = boards.map((board) => ({
      ...board,
      cards: board.cards ? [...board.cards] : [],
    }));
    const fromBoard = next.find(
      (b) => String(b.kanban_board_id) === source.droppableId,
    );
    const toBoard = next.find(
      (b) => String(b.kanban_board_id) === destination.droppableId,
    );
    if (!fromBoard || !toBoard || !fromBoard.cards) return;
    const [movedCard] = fromBoard.cards.splice(source.index, 1);
    if (!toBoard.cards) toBoard.cards = [];
    toBoard.cards.splice(destination.index, 0, movedCard);
    setBoards(next);

    // Cancel any previous card-move request and send the new position
    cardMoveAbortRef.current?.abort();
    const ctrl = new AbortController();
    cardMoveAbortRef.current = ctrl;
    silentPatch(
      projects.kanban.boards.board.cards.move.url({
        accountIndex,
        project: project.project_slug,
        board: source.droppableId,
        card: draggableId,
      }),
      { board_id: destination.droppableId, position: destination.index },
      ctrl.signal,
    );
  };

  const toggleCardDone = (boardId: string, cardId: string) => {
    // Find the board and card in current state
    const board = boards.find((b) => b.kanban_board_id === boardId);
    if (!board) return;

    const card = board.cards?.find((c) => c.kanban_board_card_id === cardId);
    if (!card) return;

    // Calculate new completion state
    const newValue = !card.is_completed;

    // Create updated card with new completion state
    const updatedCard: KanbanBoardCard = { ...card, is_completed: newValue };

    // Update boards state
    setBoards((prevBoards) =>
      prevBoards.map((b) => {
        if (b.kanban_board_id !== boardId) return b;
        return {
          ...b,
          cards: b.cards?.map((c) =>
            c.kanban_board_card_id === cardId ? updatedCard : c,
          ),
        };
      }),
    );

    // Update modal if this card is open
    if (openCard?.card.kanban_board_card_id === cardId) {
      setOpenCard({ card: updatedCard, boardId });
    }

    // Persist to backend
    router.patch(
      projects.kanban.cards.detail.update.url({
        accountIndex,
        project: project.project_slug,
        card: cardId,
      }),
      { is_completed: newValue },
      {
        ...inertiaWriteOptions,
        onError: () => console.error('Failed to toggle card done'),
      },
    );
  };

  const handleAddCard = async (
    boardId: string,
    title: string,
    labelIds: string[],
  ) => {
    // Pre-generate the UUID on the client so we can optimistically render
    // the new card before the server round-trip completes — the server
    // will persist with this exact ID.
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
    setModalBoardId(null);

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
          // Revert optimistic insertion on failure
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
          alert('Failed to create card.');
        },
      },
    );
  };

  const handleAddBoard = async (name: string) => {
    const boardId = crypto.randomUUID();
    const now = new Date().toISOString();

    const optimisticBoard: KanbanBoard = {
      kanban_board_id: boardId,
      kanban_board_project_id: project.project_id,
      kanban_board_name: name,
      kanban_board_position: boards.length,
      cards: [],
      created_at: now,
      updated_at: now,
    };

    setBoards((prev) => [...prev, optimisticBoard]);
    setAddingBoard(false);

    router.post(
      projects.kanban.boards.store.url({
        accountIndex,
        project: project.project_slug,
      }),
      { kanban_board_id: boardId, name, position: boards.length },
      {
        ...inertiaWriteOptions,
        onError: (errors) => {
          setBoards((prev) =>
            prev.filter((b) => b.kanban_board_id !== boardId),
          );
          console.error('Failed to add board:', errors);
          alert('Failed to create board.');
        },
      },
    );
  };

  const handleRenameBoard = async (boardId: string, newName: string) => {
    setBoards((prev) =>
      prev.map((b) =>
        b.kanban_board_id === boardId
          ? { ...b, kanban_board_name: newName }
          : b,
      ),
    );

    router.patch(
      projects.kanban.boards.board.update.url({
        accountIndex,
        project: project.project_slug,
        board: boardId,
      }),
      { name: newName },
      {
        ...inertiaWriteOptions,
        onError: () => console.error('Failed to rename board'),
      },
    );
  };

  const handleDeleteBoard = async (boardId: string) => {
    setBoards((prev) => prev.filter((b) => b.kanban_board_id !== boardId));

    router.delete(
      projects.kanban.boards.board.destroy.url({
        accountIndex,
        project: project.project_slug,
        board: boardId,
      }),
      {
        ...inertiaWriteOptions,
        onError: () => console.error('Failed to delete board'),
      },
    );
  };

  const handleDeleteCard = async (boardId: string, cardId: string) => {
    setBoards((prev) =>
      prev.map((b) =>
        b.kanban_board_id !== boardId
          ? b
          : {
              ...b,
              cards: b.cards?.filter((c) => c.kanban_board_card_id !== cardId),
            },
      ),
    );
    if (openCard?.card.kanban_board_card_id === cardId) setOpenCard(null);

    router.delete(
      projects.kanban.boards.board.cards.destroy.url({
        accountIndex,
        project: project.project_slug,
        board: boardId,
        card: cardId,
      }),
      {
        ...inertiaWriteOptions,
        onError: () => console.error('Failed to delete card'),
      },
    );
  };

  const handleCardUpdate = (
    updatedCard: KanbanBoardCard,
    targetBoardId: string,
  ) => {
    setBoards((prev) =>
      prev.map((board) => {
        // If card is in this board, update it in-place
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
        // If card was moved to a different board, remove it from this board
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
      <Head title={`Kanban - ${project.project_name}`} />

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

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex h-full w-full flex-col overflow-hidden bg-dark-surface-1">
          <header className="flex w-full shrink-0 items-center justify-between px-2 py-2">
            <div className="relative">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                type="text"
                placeholder="Search all cards"
                className="w-64 rounded-full border-2 border-dark-surface-3 bg-dark-surface-2 px-4 py-2 pl-9 text-small font-semibold text-dark-primary placeholder-dark-secondary transition focus:border-dark-border-focus focus:outline-none"
              />
              <span className="absolute top-1/2 left-3 -translate-y-1/2 text-dark-secondary">
                <SearchIcon className="h-4 w-4" />
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xsmall text-white/20">
                {boards.length} boards
              </span>
            </div>
          </header>

          <main className="scrollbar-app m-2 mr-4 flex w-full flex-1 items-start gap-4 overflow-x-auto pr-4">
            <Droppable droppableId="boards" type="BOARD" direction="horizontal">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="flex items-start gap-4"
                >
                  {boards
                    .filter((board) => {
                      if (!searchQuery.trim()) return true;
                      return board.cards?.some((card) =>
                        card.kanban_board_card_title
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase()),
                      );
                    })
                    .map((board, index) => (
                      <KanbanColumn
                        key={board.kanban_board_id}
                        board={board}
                        index={index}
                        onToggleDone={toggleCardDone}
                        onAddCard={(id) => setModalBoardId(id)}
                        onRenameBoard={handleRenameBoard}
                        onDeleteBoard={handleDeleteBoard}
                        onDeleteCard={handleDeleteCard}
                        searchQuery={searchQuery}
                        onCardClick={(card, boardId) => {
                          const alreadyOpen = openCard !== null;
                          setOpenCard({ card, boardId });
                          const scrollToCard = () => {
                            document
                              .querySelector(
                                `[data-card-id="${card.kanban_board_card_id}"]`,
                              )
                              ?.scrollIntoView({
                                behavior: 'smooth',
                                block: 'nearest',
                                inline: 'nearest',
                              });
                          };
                          if (alreadyOpen) {
                            requestAnimationFrame(scrollToCard);
                          } else {
                            setTimeout(scrollToCard, 320);
                          }
                        }}
                      />
                    ))}

                  {addingBoard ? (
                    <AddBoardInput
                      onAdd={handleAddBoard}
                      onCancel={() => setAddingBoard(false)}
                    />
                  ) : (
                    <button
                      onClick={() => setAddingBoard(true)}
                      className="flex h-fit w-70 shrink-0 items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-dark-surface-3 py-6 text-small font-semibold text-dark-surface-3 transition hover:border-dark-secondary hover:text-dark-secondary"
                    >
                      <AddIcon />
                      Add board
                    </button>
                  )}

                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </main>
        </div>
      </DragDropContext>

      {modalBoardId && (
        <AddCardModal
          boards={boards}
          cardLabels={cardLabels}
          defaultBoardId={modalBoardId}
          onClose={() => setModalBoardId(null)}
          onSubmit={handleAddCard}
        />
      )}
    </AppLayout>
  );
}
