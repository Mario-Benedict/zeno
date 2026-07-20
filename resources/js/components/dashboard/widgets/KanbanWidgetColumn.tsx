import { useMemo } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import type { KanbanBoard, KanbanBoardCard } from '@/types/kanban';
import { KanbanWidgetCard } from './KanbanWidgetCard';

interface Props {
  board: KanbanBoard;
  searchQuery: string;
  onToggleDone: (cardId: string) => void;
  onCardClick: (card: KanbanBoardCard) => void;
}

export const KanbanWidgetColumn = ({
  board,
  searchQuery,
  onToggleDone,
  onCardClick,
}: Props) => {
  const { t } = useTranslation();
  const filteredCards = useMemo(() => {
    if (!board.cards) return [];
    const query = searchQuery.trim().toLowerCase();
    if (!query) return board.cards;

    return board.cards.filter((card) =>
      card.kanban_board_card_title.toLowerCase().includes(query),
    );
  }, [board.cards, searchQuery]);

  return (
    <div className="flex h-full w-40 shrink-0 flex-col rounded-xl bg-black/15 sm:w-48">
      <div className="flex shrink-0 items-center justify-between gap-2 px-2.5 pt-2 pb-1.5">
        <p className="truncate text-xsmall font-semibold text-dark-primary">
          {board.kanban_board_name}
        </p>
        <span className="shrink-0 text-micro text-dark-secondary/80">
          {filteredCards.length}
        </span>
      </div>

      <div className="scrollbar-app flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto px-1.5 pb-2">
        {filteredCards.length === 0 ? (
          <p className="px-2 py-4 text-center text-micro text-dark-secondary/70">
            {searchQuery.trim()
              ? t('dashboard.noMatches')
              : t('dashboard.noCards')}
          </p>
        ) : (
          filteredCards.map((card) => (
            <KanbanWidgetCard
              key={card.kanban_board_card_id}
              card={card}
              onToggleDone={onToggleDone}
              onClick={() => onCardClick(card)}
            />
          ))
        )}
      </div>
    </div>
  );
};
