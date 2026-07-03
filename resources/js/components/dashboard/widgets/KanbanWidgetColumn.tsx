import type { KanbanBoard, KanbanBoardCard } from '@/types/kanban';
import { KanbanWidgetCard } from './KanbanWidgetCard';

interface Props {
  board: KanbanBoard;
  onToggleDone: (cardId: string) => void;
  onCardClick: (card: KanbanBoardCard) => void;
}

export const KanbanWidgetColumn = ({
  board,
  onToggleDone,
  onCardClick,
}: Props) => (
  <div className="flex h-full w-40 shrink-0 flex-col rounded-xl bg-black/15 sm:w-48">
    <div className="flex shrink-0 items-center justify-between gap-2 px-2.5 pt-2 pb-1.5">
      <p className="truncate text-xsmall font-semibold text-white/70">
        {board.kanban_board_name}
      </p>
      <span className="shrink-0 text-micro text-white/30">
        {board.cards?.length ?? 0}
      </span>
    </div>

    <div className="scrollbar-app flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto px-1.5 pb-2">
      {!board.cards || board.cards.length === 0 ? (
        <p className="px-2 py-4 text-center text-micro text-white/20">
          No cards
        </p>
      ) : (
        board.cards.map((card) => (
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
