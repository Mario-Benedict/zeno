import { useTranslation } from '@/hooks/useTranslation';
import type { KanbanBoardCard } from '@/types/kanban';
import { calculateChecklistProgress, getContrastColor } from '@/utils/kanban';
import CheckIcon from '@public/icons/small/check.svg';

interface Props {
  card: KanbanBoardCard;
  onToggleDone: (cardId: string) => void;
  onClick: () => void;
}

export const KanbanWidgetCard = ({ card, onToggleDone, onClick }: Props) => {
  const { t } = useTranslation();
  const checklistProgress = calculateChecklistProgress(card.checklists);
  const hasMeta = !!card.labels?.length || checklistProgress.total > 0;

  return (
    <div
      onClick={onClick}
      className="flex cursor-pointer items-start gap-2 rounded-lg bg-dark-surface-3 p-2 transition hover:bg-white/10"
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleDone(card.kanban_board_card_id);
        }}
        aria-label={
          card.is_completed
            ? t('dashboard.markAsNotDone')
            : t('dashboard.markAsDone')
        }
        className={`mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
          card.is_completed
            ? 'border-accent-blue bg-accent-blue'
            : 'border-dark-secondary hover:border-dark-primary'
        }`}
      >
        {card.is_completed && (
          <CheckIcon className="h-2 w-2 text-dark-primary" />
        )}
      </button>

      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-xsmall leading-snug font-medium ${
            card.is_completed ? 'text-white/30 line-through' : 'text-white/90'
          }`}
        >
          {card.kanban_board_card_title}
        </p>

        {hasMeta && (
          <div className="mt-1 flex flex-wrap items-center gap-1">
            {card.labels?.map((label) => (
              <span
                key={label.card_label_id}
                className="rounded-full px-1.5 py-0.5 text-micro font-semibold"
                style={{
                  backgroundColor: label.card_label_color_hex,
                  color: getContrastColor(label.card_label_color_hex),
                }}
              >
                {label.card_label_name}
              </span>
            ))}
            {checklistProgress.total > 0 && (
              <span className="text-micro text-white/40">
                {checklistProgress.done}/{checklistProgress.total}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
