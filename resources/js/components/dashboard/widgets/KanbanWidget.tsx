import { router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { useProject } from '@/hooks/useProject';
import projects from '@/routes/projects';
import type { KanbanBoard } from '@/types/kanban';
import { KanbanWidgetCardDetail } from './KanbanWidgetCardDetail';
import { KanbanWidgetColumn } from './KanbanWidgetColumn';
import { WidgetSearchHeader } from './WidgetSearchHeader';

interface Props {
  kanbanBoards: KanbanBoard[];
}

/**
 * Compact, read-focused kanban view for a dashboard slot — not the full
 * kanban page. Deliberately built from scratch (not the `components/kanban`
 * page components) so it can scale down to a small slot without dragging in
 * drag-and-drop, board management, or full card editing.
 */
export const KanbanWidget = ({ kanbanBoards }: Props) => {
  const { project, accountIndex } = useProject();
  const [boards, setBoards] = useState<KanbanBoard[]>(kanbanBoards);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const totalCards = boards.reduce(
    (sum, board) => sum + (board.cards?.length ?? 0),
    0,
  );

  const selectedCard = selectedCardId
    ? (boards
        .flatMap((board) => board.cards ?? [])
        .find((card) => card.kanban_board_card_id === selectedCardId) ?? null)
    : null;

  // Boards with at least one matching card stay visible (with only the
  // matching cards shown inside — see KanbanWidgetColumn); boards with zero
  // matches are hidden entirely, mirroring the full kanban page's search.
  const visibleBoards = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return boards;

    return boards.filter((board) =>
      board.cards?.some((card) =>
        (card.detail?.kanban_board_card_title ?? '')
          .toLowerCase()
          .includes(query),
      ),
    );
  }, [boards, searchQuery]);

  const toggleDone = (cardId: string) => {
    let newValue = false;

    setBoards((prev) =>
      prev.map((board) => ({
        ...board,
        cards: board.cards?.map((card) => {
          if (card.kanban_board_card_id !== cardId || !card.detail) {
            return card;
          }
          newValue = !card.detail.is_completed;
          return {
            ...card,
            detail: { ...card.detail, is_completed: newValue },
          };
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
        title="Kanban"
        countLabel={`${totalCards} card${totalCards === 1 ? '' : 's'}`}
        searchOpen={searchOpen}
        query={searchQuery}
        onQueryChange={setSearchQuery}
        onOpenSearch={() => setSearchOpen(true)}
        onCloseSearch={() => {
          setSearchOpen(false);
          setSearchQuery('');
        }}
        searchLabel="Search cards"
        placeholder="Search cards…"
      />

      {boards.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-4 text-center text-xsmall text-white/30">
          No boards yet. Create one from the Kanban page.
        </div>
      ) : visibleBoards.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-4 text-center text-xsmall text-white/30">
          No cards match your search.
        </div>
      ) : (
        <div className="scrollbar-app flex min-h-0 flex-1 gap-2 overflow-x-auto px-3 pb-3">
          {visibleBoards.map((board) => (
            <KanbanWidgetColumn
              key={board.kanban_board_id}
              board={board}
              searchQuery={searchQuery}
              onToggleDone={toggleDone}
              onCardClick={(card) =>
                setSelectedCardId(card.kanban_board_card_id)
              }
            />
          ))}
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
