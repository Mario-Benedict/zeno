import { useState, useMemo, useRef, useEffect } from 'react';
import { KanbanBoard, KanbanBoardCard } from './types';
import { KanbanCard } from './KanbanCard';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import AddIcon from '@public/icons/small/plus.svg';
import CloseIcon from '@public/icons/small/cancel.svg';

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
                .includes(searchQuery.toLowerCase())
        );
    }, [board.cards, searchQuery]);

    return (
        <Draggable draggableId={String(board.kanban_board_id)} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={`max-h-[calc(100vh-10.5rem)] h-fit shrink-0 w-70 rounded-2xl flex flex-col transition-all ${
                        snapshot.isDragging
                            ? 'bg-dark-surface-1 shadow-2xl rotate-1 z-50 ring-1 ring-accent-blue/50'
                            : 'bg-dark-surface-2'
                    }`}
                >
                    {/* Header */}
                    <div
                        {...provided.dragHandleProps}
                        className="px-4 pt-4 pb-3 flex items-center justify-between gap-2 shrink-0 cursor-grab active:cursor-grabbing"
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
                        className="w-50 bg-dark-surface-3 border border-dark-border-focus rounded-lg px-2 py-1 text-medium font-bold text-white focus:outline-none"
                    />
                ) : (
                    <p
                        className="text-medium font-bold text-white tracking-tight cursor-pointer hover:text-white/80 transition flex-1 truncate"
                        onClick={() => setEditingName(true)}
                        title="Click to rename"
                    >
                        {board.kanban_board_name}
                        <span className="text-white/20 ml-2 text-xsmall font-normal">
                            {board.cards?.length || 0}
                        </span>
                    </p>
                )}

                <div className="flex items-center gap-1 shrink-0">
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        title="Delete board"
                        className="text-dark-secondary hover:text-accent-red p-1.5 rounded-lg hover:bg-dark-surface-3 shrink-0"
                    >
                        <CloseIcon className="w-4 h-4" />
                    </button>

                    {showDeleteConfirm && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                            <div
                                className="bg-dark-surface-2 border border-dark-border rounded-xl p-5 w-full max-w-sm shadow-2xl"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <h3 className="text-normal font-semibold text-white mb-2">Delete Board</h3>
                                <p className="text-small text-white/60 mb-6 leading-relaxed">
                                    Are you sure you want to delete{' '}
                                    <strong className="text-white font-semibold">"{board.kanban_board_name}"</strong>?
                                    All cards inside it will be permanently removed.
                                </p>
                                <div className="flex items-center justify-end gap-3">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false); }}
                                        className="px-4 py-2 rounded-lg text-small font-medium text-white/50 hover:text-white hover:bg-white/10 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteBoard(board.kanban_board_id);
                                            setShowDeleteConfirm(false);
                                        }}
                                        className="px-4 py-2 rounded-lg text-small font-medium bg-accent-red/15 text-accent-red border border-accent-red/20 hover:bg-accent-red/30 transition"
                                    >
                                        Yes, delete it
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Cards */}
            <Droppable droppableId={String(board.kanban_board_id)}>
                {(provided) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="min-h-0 px-3 pb-3 flex flex-col gap-2 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-dark-surface-3 hover:[&::-webkit-scrollbar-thumb]:bg-dark-secondary [&::-webkit-scrollbar-thumb]:rounded-full transition-colors"
                    >
                        {filteredCards.length === 0 && (
                            <div className="py-8 text-center text-white/20 text-xsmall rounded-xl">
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
            <div className="px-3 pb-3 shrink-0">
                <button
                    onClick={() => onAddCard(board.kanban_board_id)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-white/30 hover:text-white/70 hover:bg-white/5 transition text-small"
                >
                    <AddIcon className="w-4 h-4" />
                    Add a card
                </button>
            </div>
                </div>
            )}
        </Draggable>
    );
};
