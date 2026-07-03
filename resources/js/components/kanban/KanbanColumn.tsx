import { Droppable, Draggable } from '@hello-pangea/dnd';
import { useState, useMemo, useRef, useEffect } from 'react';
import ConfirmModal from '@/components/shared/ConfirmModal';
import type { KanbanBoard, KanbanBoardCard } from '@/types/kanban';
import CloseIcon from '@public/icons/small/cancel.svg';
import AddIcon from '@public/icons/small/plus.svg';
import { KanbanCard } from './KanbanCard';

interface KanbanColumnProps {
  board: KanbanBoard;
  index: number;
  onToggleDone: (boardId: string, cardId: string) => void;
  onAddCard: (boardId: string) => void;
  onRenameBoard: (boardId: string, newName: string) => void;
  onDeleteBoard: (boardId: string) => void;
  onDeleteCard: (boardId: string, cardId: string) => void;
  searchQuery: string;
  onCardClick: (card: KanbanBoardCard, boardId: string) => void;
}

export const KanbanColumn = ({
  board,
  index,
  onToggleDone,
  onAddCard,
  onRenameBoard,
  onDeleteBoard,
  onDeleteCard,
  searchQuery,
  onCardClick,
}: KanbanColumnProps) => {
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(board.kanban_board_name);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingName) inputRef.current?.focus();
  }, [editingName]);

  const commitRename = () => {
    setEditingName(false);
    const trimmed = nameValue.trim();
    if (trimmed && trimmed !== board.kanban_board_name) {
      onRenameBoard(board.kanban_board_id, trimmed);
    } else {
      setNameValue(board.kanban_board_name);
    }
  };

  const filteredCards = useMemo(() => {
    if (!board.cards) return [];
    return board.cards.filter((card) =>
      (card.detail?.kanban_board_card_title || '')
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
    );
  }, [board.cards, searchQuery]);

  return (
    <Draggable draggableId={String(board.kanban_board_id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          style={{
            ...provided.draggableProps.style,
            ...(snapshot.isDropAnimating && { transitionDuration: '0.001s' }),
          }}
          className={`flex h-fit max-h-[calc(100vh-10.5rem)] w-70 shrink-0 flex-col rounded-2xl ${
            snapshot.isDragging
              ? 'z-50 rotate-1 bg-dark-surface-1 shadow-2xl ring-1 ring-accent-blue/50'
              : 'bg-dark-surface-2'
          }`}
        >
          {/* Header */}
          <div
            {...provided.dragHandleProps}
            className="flex shrink-0 cursor-grab items-center justify-between gap-2 px-4 pt-4 pb-3 active:cursor-grabbing"
          >
            {editingName ? (
              <input
                ref={inputRef}
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitRename();
                  if (e.key === 'Escape') {
                    setNameValue(board.kanban_board_name);
                    setEditingName(false);
                  }
                }}
                className="w-50 rounded-lg border border-dark-border-focus bg-dark-surface-3 px-2 py-1 text-medium font-bold text-white focus:outline-none"
              />
            ) : (
              <p
                className="flex-1 cursor-pointer truncate text-medium font-bold tracking-tight text-white transition hover:text-white/80"
                onClick={() => setEditingName(true)}
                title="Click to rename"
              >
                {board.kanban_board_name}
                <span className="ml-2 text-xsmall font-normal text-white/20">
                  {board.cards?.length || 0}
                </span>
              </p>
            )}

            <div className="flex shrink-0 items-center gap-1">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                title="Delete board"
                className="shrink-0 rounded-lg p-1.5 text-dark-secondary hover:bg-dark-surface-3 hover:text-accent-red"
              >
                <CloseIcon className="h-4 w-4" />
              </button>

              {showDeleteConfirm && (
                <ConfirmModal
                  title="Delete Board"
                  description={
                    <>
                      Are you sure you want to delete{' '}
                      <strong className="font-semibold text-white">
                        "{board.kanban_board_name}"
                      </strong>
                      ? All cards inside it will be permanently removed.
                    </>
                  }
                  confirmLabel="Yes, delete it"
                  onCancel={() => setShowDeleteConfirm(false)}
                  onConfirm={() => {
                    onDeleteBoard(board.kanban_board_id);
                    setShowDeleteConfirm(false);
                  }}
                />
              )}
            </div>
          </div>

          {/* Cards */}
          <Droppable droppableId={String(board.kanban_board_id)}>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="scrollbar-app flex min-h-0 flex-col gap-2 overflow-y-auto px-3 pb-3 transition-colors"
              >
                {filteredCards.length === 0 && (
                  <div className="rounded-xl py-8 text-center text-xsmall text-white/20">
                    No cards yet
                  </div>
                )}

                {filteredCards.map((card, index) => (
                  <KanbanCard
                    key={card.kanban_board_card_id}
                    card={card}
                    boardId={board.kanban_board_id}
                    index={index}
                    onToggleDone={onToggleDone}
                    onDeleteCard={onDeleteCard}
                    onClick={() => onCardClick(card, board.kanban_board_id)}
                  />
                ))}

                {provided.placeholder}
              </div>
            )}
          </Droppable>

          {/* Add card */}
          <div className="shrink-0 px-3 pb-3">
            <button
              onClick={() => onAddCard(board.kanban_board_id)}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-small text-white/30 transition hover:bg-white/5 hover:text-white/70"
            >
              <AddIcon className="h-4 w-4" />
              Add a card
            </button>
          </div>
        </div>
      )}
    </Draggable>
  );
};
