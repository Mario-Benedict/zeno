import AppLayout from '@/layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { DragDropContext, DropResult, Droppable } from '@hello-pangea/dnd';
import SearchIcon from '@public/icons/small/search.svg';
import AddIcon from '@public/icons/small/plus.svg';

import {
    KanbanColumn,
    CardDetailModalWrapper,
    AddCardModal,
    AddBoardInput,
    type KanbanBoardCard,
    type KanbanBoard,
    type KanbanProps,
} from '@/components/kanban';

export default function Kanban({
    project,
    kanbanBoards,
    projectUsers,
    currentUser,
    cardLabels,
}: KanbanProps) {
    const [boards, setBoards] = useState<KanbanBoard[]>(kanbanBoards);
    const [searchQuery, setSearchQuery] = useState('');
    const [modalBoardId, setModalBoardId] = useState<string | null>(null);
    const [addingBoard, setAddingBoard] = useState(false);
    const [openCard, setOpenCard] = useState<{ card: KanbanBoardCard; boardId: string } | null>(null);

    const onDragEnd = (result: DropResult) => {
        const { source, destination, draggableId, type } = result;

        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        // Handle column reordering
        if (type === 'BOARD') {
            setBoards((prev) => {
                const next = [...prev];
                const [movedBoard] = next.splice(source.index, 1);
                next.splice(destination.index, 0, movedBoard);
                return next;
            });

            // Update all board positions in backend
            setBoards((prev) => {
                prev.forEach((board, idx) => {
                    if (board.kanban_board_position !== idx) {
                        fetch(`/boards/${board.kanban_board_id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                            body: JSON.stringify({ position: idx }),
                        }).catch((err) => console.error('Failed to persist board move', err));
                    }
                });
                return prev;
            });
            return;
        }

        // Handle card reordering
        setBoards((prev) => {
            const next = prev.map((board) => ({
                ...board,
                cards: board.cards ? [...board.cards] : [],
            }));
            const fromBoard = next.find((b) => String(b.kanban_board_id) === source.droppableId);
            const toBoard = next.find((b) => String(b.kanban_board_id) === destination.droppableId);
            if (!fromBoard || !toBoard || !fromBoard.cards) return prev;
            const [movedCard] = fromBoard.cards.splice(source.index, 1);
            if (!toBoard.cards) toBoard.cards = [];
            toBoard.cards.splice(destination.index, 0, movedCard);
            return next;
        });

        fetch(`/cards/${draggableId}/move`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            body: JSON.stringify({ board_id: destination.droppableId, position: destination.index }),
        }).catch((err) => console.error('Failed to persist card move', err));
    };

    const toggleCardDone = (boardId: string, cardId: string) => {
        // First, find the board and card in current state
        const board = boards.find((b) => b.kanban_board_id === boardId);
        if (!board) return;

        const card = board.cards?.find((c) => c.kanban_board_card_id === cardId);
        if (!card || !card.detail) return;

        // Calculate new completion state
        const newValue = !card.detail.is_completed;

        // Create updated card with new detail
        const updatedCard: KanbanBoardCard = {
            ...card,
            detail: { ...card.detail, is_completed: newValue },
        };

        // Update boards state
        setBoards((prevBoards) =>
            prevBoards.map((b) => {
                if (b.kanban_board_id !== boardId) return b;
                return {
                    ...b,
                    cards: b.cards?.map((c) =>
                        c.kanban_board_card_id === cardId ? updatedCard : c
                    ),
                };
            })
        );

        // Update modal if this card is open
        if (openCard?.card.kanban_board_card_id === cardId) {
            setOpenCard({ card: updatedCard, boardId });
        }

        // Persist to backend
        fetch(`/cards/${cardId}/detail`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            body: JSON.stringify({ is_completed: newValue }),
        }).catch((err) => console.error('Failed to toggle card done', err));
    };

    const handleAddCard = async (boardId: string, title: string, labelIds: string[]) => {
        try {
            const res = await fetch(`/boards/${boardId}/cards`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                body: JSON.stringify({ title, label_ids: labelIds }),
            });
            if (!res.ok) throw new Error(`Server error ${res.status}`);
            const data = await res.json();
            if (!data?.card?.kanban_board_card_id) {
                alert('Invalid response from server.');
                return;
            }
            setBoards((prev) =>
                prev.map((b) =>
                    b.kanban_board_id !== boardId ? b : { ...b, cards: [...(b.cards || []), data.card] }
                )
            );
            setModalBoardId(null);
        } catch (err) {
            console.error('Failed to add card', err);
            alert(`Failed to create card: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    const handleAddBoard = async (name: string) => {
        try {
            const res = await fetch(`/p/${project.project_slug}/boards`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                body: JSON.stringify({ name, position: boards.length }),
            });
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            const data = await res.json();
            if (!data?.board?.kanban_board_id) {
                alert('Failed to create board. Invalid response from server.');
                return;
            }
            setBoards((prev) => [...prev, data.board]);
            setAddingBoard(false);
        } catch (err) {
            console.error('Failed to add board:', err);
            alert(`Failed to create board: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    const handleRenameBoard = async (boardId: string, newName: string) => {
        setBoards((prev) =>
            prev.map((b) => (b.kanban_board_id === boardId ? { ...b, kanban_board_name: newName } : b))
        );
        try {
            await fetch(`/boards/${boardId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                body: JSON.stringify({ name: newName }),
            });
        } catch (err) {
            console.error('Failed to rename board', err);
        }
    };

    const handleDeleteBoard = async (boardId: string) => {
        setBoards((prev) => prev.filter((b) => b.kanban_board_id !== boardId));
        try {
            await fetch(`/boards/${boardId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            });
        } catch (err) {
            console.error('Failed to delete board', err);
        }
    };

    const handleDeleteCard = async (boardId: string, cardId: string) => {
        setBoards((prev) =>
            prev.map((b) =>
                b.kanban_board_id !== boardId
                    ? b
                    : { ...b, cards: b.cards?.filter((c) => c.kanban_board_card_id !== cardId) }
            )
        );
        if (openCard?.card.kanban_board_card_id === cardId) setOpenCard(null);
        try {
            await fetch(`/cards/${cardId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            });
        } catch (err) {
            console.error('Failed to delete card', err);
        }
    };

    const handleCardUpdate = (updatedCard: KanbanBoardCard, targetBoardId: string) => {
        setBoards((prev) =>
            prev.map((board) => {
                // If card is in this board, update it in-place
                if (board.kanban_board_id === targetBoardId) {
                    return {
                        ...board,
                        cards: board.cards?.map((c) =>
                            c.kanban_board_card_id === updatedCard.kanban_board_card_id ? updatedCard : c
                        ),
                    };
                }
                // If card was moved to a different board, remove it from this board
                return {
                    ...board,
                    cards: board.cards?.filter(
                        (c) => c.kanban_board_card_id !== updatedCard.kanban_board_card_id
                    ),
                };
            })
        );
        if (openCard?.card.kanban_board_card_id === updatedCard.kanban_board_card_id) {
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
                    onClose={() => setOpenCard(null)}
                    onUpdate={handleCardUpdate}
                />
            )}

            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex flex-col w-full h-full bg-dark-surface-1 overflow-hidden">
                    <header className="flex w-full items-center justify-between px-2 py-2 shrink-0">
                        <div className="relative">
                            <input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                type="text"
                                placeholder="Search all cards"
                                className="bg-dark-surface-2 text-small font-semibold text-dark-primary placeholder-dark-secondary rounded-full px-4 py-2 pl-9 w-64 border-2 border-dark-surface-3 focus:outline-none focus:border-dark-border-focus transition"
                            />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-secondary">
                                <SearchIcon className="h-4 w-4" />
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xsmall text-white/20">{boards.length} boards</span>
                        </div>
                    </header>

                    <main className="items-start flex w-full gap-4 m-2 mr-4 pr-4 overflow-x-auto flex-1 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-dark-surface-3 hover:[&::-webkit-scrollbar-thumb]:bg-dark-secondary [&::-webkit-scrollbar-thumb]:rounded-full">
                        <Droppable droppableId="boards" type="BOARD" direction="horizontal">
                            {(provided) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className="flex gap-4 items-start"
                                >
                                    {boards
                                        .filter((board) => {
                                            if (!searchQuery.trim()) return true;
                                            return board.cards?.some((card) =>
                                                card.detail?.kanban_board_card_title
                                                    .toLowerCase()
                                                    .includes(searchQuery.toLowerCase())
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
                                                onCardClick={(card, boardId) => setOpenCard({ card, boardId })}
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
                                            className="shrink-0 w-70 h-fit rounded-2xl border-2 border-dashed border-dark-surface-3 hover:border-dark-secondary transition py-6 flex items-center justify-center gap-2 text-dark-surface-3 hover:text-dark-secondary text-small font-semibold"
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
