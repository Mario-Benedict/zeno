import type { KanbanBoardCard } from '@/types/kanban';
import {
  calculateChecklistProgress,
  formatDate,
  generateInitials,
  getContrastColor,
  MEMBER_COLORS,
} from '@/utils/kanban';
import CloseIcon from '@public/icons/small/cancel.svg';
import CheckIcon from '@public/icons/small/check.svg';
import ChecklistIcon from '@public/icons/small/checkbox.svg';
import CommentIcon from '@public/icons/small/comment.svg';
import PaperclipIcon from '@public/icons/small/paperclip.svg';
import TimeIcon from '@public/icons/small/time.svg';

interface Props {
  card: KanbanBoardCard;
  onClose: () => void;
  onToggleDone: (cardId: string) => void;
}

/**
 * Read-only card detail popup for the dashboard widget — shows everything
 * the full kanban page's detail panel does (labels, members, dates,
 * description, checklists, attachments, comments), just without any of the
 * editing affordances (no add/remove/toggle/delete beyond the card's own
 * "mark as done", which is the one interaction the widget supports).
 */
export const KanbanWidgetCardDetail = ({
  card,
  onClose,
  onToggleDone,
}: Props) => {
  const detail = card.detail;
  if (!detail) return null;

  const startDate = detail.dates?.kanban_board_card_start_date;
  const dueDate = detail.dates?.kanban_board_card_due_date;

  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="scrollbar-app max-h-full w-full max-w-sm overflow-y-auto rounded-2xl bg-dark-surface-2 p-4 shadow-2xl"
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

        {/* Labels */}
        {!!detail.labels?.length && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {detail.labels.map((label) =>
              label.color ? (
                <span
                  key={label.card_label_id}
                  className="rounded-full px-2 py-0.5 text-micro font-semibold"
                  style={{
                    backgroundColor: label.color.card_label_color_hex,
                    color: getContrastColor(label.color.card_label_color_hex),
                  }}
                >
                  {label.card_label_name}
                </span>
              ) : null,
            )}
          </div>
        )}

        {/* Members */}
        {!!detail.members?.length && (
          <div className="mb-3 flex items-center gap-2">
            <div className="flex -space-x-1.5">
              {detail.members.map((member, i) => (
                <div
                  key={member.id}
                  title={member.name}
                  className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-dark-surface-2 text-micro font-bold text-white"
                  style={{
                    backgroundColor: MEMBER_COLORS[i % MEMBER_COLORS.length],
                  }}
                >
                  {generateInitials(member.name)}
                </div>
              ))}
            </div>
            <span className="text-micro text-white/40">
              {detail.members.map((m) => m.name).join(', ')}
            </span>
          </div>
        )}

        {/* Dates */}
        {(startDate || dueDate) && (
          <div className="mb-3 flex flex-wrap items-center gap-3 text-micro text-white/40">
            {startDate && (
              <span className="flex items-center gap-1">
                <TimeIcon className="h-3 w-3" />
                Start {formatDate(startDate)}
              </span>
            )}
            {dueDate && (
              <span className="flex items-center gap-1">
                <TimeIcon className="h-3 w-3" />
                Due {formatDate(dueDate)}
              </span>
            )}
          </div>
        )}

        {/* Description */}
        {detail.kanban_board_card_description && (
          <p className="mb-3 text-xsmall whitespace-pre-wrap text-white/60">
            {detail.kanban_board_card_description}
          </p>
        )}

        {/* Checklists */}
        {!!detail.checklists?.length &&
          detail.checklists.map((checklist) => {
            const progress = calculateChecklistProgress([checklist]);

            return (
              <div
                key={checklist.kanban_board_card_checklist_id}
                className="mb-3"
              >
                <div className="mb-1.5 flex items-center justify-between text-micro text-white/40">
                  <span className="flex items-center gap-1">
                    <ChecklistIcon className="h-3 w-3" />
                    {checklist.kanban_board_card_checklist_name}
                  </span>
                  {progress.total > 0 && (
                    <span>
                      {progress.done}/{progress.total}
                    </span>
                  )}
                </div>

                {progress.total > 0 && (
                  <div className="mb-1.5 h-1 w-full overflow-hidden rounded-full bg-dark-surface-3">
                    <div
                      className="h-full rounded-full bg-accent-blue transition-all"
                      style={{
                        width: `${(progress.done / progress.total) * 100}%`,
                      }}
                    />
                  </div>
                )}

                <div className="space-y-1">
                  {checklist.items?.map((item) => (
                    <div
                      key={item.kanban_board_card_checklist_item_id}
                      className="flex items-center gap-2"
                    >
                      <span
                        className={`flex h-3 w-3 shrink-0 items-center justify-center rounded-sm border ${
                          item.is_completed
                            ? 'border-accent-blue bg-accent-blue'
                            : 'border-white/25'
                        }`}
                      >
                        {item.is_completed && (
                          <CheckIcon className="h-2 w-2 text-white" />
                        )}
                      </span>
                      <span
                        className={`text-xsmall ${
                          item.is_completed
                            ? 'text-white/30 line-through'
                            : 'text-white/70'
                        }`}
                      >
                        {item.kanban_board_card_checklist_item_name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

        {/* Attachments */}
        {!!detail.attachments?.length && (
          <div className="mb-3">
            <p className="mb-1.5 flex items-center gap-1 text-micro text-white/40">
              <PaperclipIcon className="h-3 w-3" />
              Attachments ({detail.attachments.length})
            </p>
            <div className="space-y-1">
              {detail.attachments.map((att) => (
                <p
                  key={att.kanban_board_card_attachment_id}
                  className="truncate rounded-lg bg-dark-surface-3 px-2.5 py-1.5 text-xsmall text-white/60"
                >
                  {att.kanban_board_card_attachment_name ||
                    att.kanban_board_card_attachment_url}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Comments */}
        {!!detail.comments?.length && (
          <div>
            <p className="mb-1.5 flex items-center gap-1 text-micro text-white/40">
              <CommentIcon className="h-3 w-3" />
              Comments ({detail.comments.length})
            </p>
            <div className="space-y-2">
              {detail.comments.map((comment) => (
                <div
                  key={comment.kanban_board_card_comment_id}
                  className="rounded-lg bg-dark-surface-3 px-2.5 py-1.5"
                >
                  <div className="mb-0.5 flex items-center gap-1.5">
                    <span className="text-micro font-semibold text-white/70">
                      {comment.user?.name ?? 'Unknown'}
                    </span>
                    <span className="text-micro text-white/30">
                      {formatDate(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-xsmall break-words text-white/60">
                    {comment.kanban_board_card_comment_message}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
