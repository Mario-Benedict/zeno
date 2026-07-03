import type { KanbanBoardCard } from '@/types/kanban';
import { calculateChecklistProgress, formatDate } from '@/utils/kanban';
import CloseIcon from '@public/icons/small/cancel.svg';
import CheckIcon from '@public/icons/small/check.svg';

interface Props {
  card: KanbanBoardCard;
  onClose: () => void;
  onToggleDone: (cardId: string) => void;
}

export const KanbanWidgetCardDetail = ({
  card,
  onClose,
  onToggleDone,
}: Props) => {
  const detail = card.detail;
  if (!detail) return null;

  const checklistProgress = calculateChecklistProgress(detail.checklists);
  const dueDate = detail.dates?.kanban_board_card_due_date;

  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-full w-full max-w-sm overflow-y-auto rounded-2xl bg-dark-surface-2 p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start gap-2.5">
          <button
            type="button"
            onClick={() => onToggleDone(card.kanban_board_card_id)}
            aria-label={
              detail.is_completed ? 'Mark as not done' : 'Mark as done'
            }
            className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
              detail.is_completed
                ? 'border-accent-blue bg-accent-blue'
                : 'border-dark-secondary hover:border-dark-primary'
            }`}
          >
            {detail.is_completed && (
              <CheckIcon className="h-2 w-2 text-dark-primary" />
            )}
          </button>

          <p
            className={`flex-1 text-small leading-snug font-semibold ${
              detail.is_completed ? 'text-white/40 line-through' : 'text-white'
            }`}
          >
            {detail.kanban_board_card_title}
          </p>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-lg p-1 text-dark-secondary transition hover:bg-dark-surface-3 hover:text-white"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        {detail.kanban_board_card_description && (
          <p className="mb-3 text-xsmall whitespace-pre-wrap text-white/60">
            {detail.kanban_board_card_description}
          </p>
        )}

        {!!detail.labels?.length && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {detail.labels.map((label) =>
              label.color ? (
                <span
                  key={label.card_label_id}
                  className="rounded-full px-2 py-0.5 text-micro font-medium"
                  style={{
                    backgroundColor: `${label.color.card_label_color_hex}33`,
                    color: label.color.card_label_color_hex,
                  }}
                >
                  {label.card_label_name}
                </span>
              ) : null,
            )}
          </div>
        )}

        {checklistProgress.total > 0 && (
          <div className="mb-3">
            <div className="mb-1 flex items-center justify-between text-micro text-white/40">
              <span>Checklist</span>
              <span>
                {checklistProgress.done}/{checklistProgress.total}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-dark-surface-3">
              <div
                className="h-full rounded-full bg-accent-blue transition-all"
                style={{
                  width: `${(checklistProgress.done / checklistProgress.total) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {dueDate && (
          <p className="text-micro text-white/40">Due {formatDate(dueDate)}</p>
        )}
      </div>
    </div>
  );
};
