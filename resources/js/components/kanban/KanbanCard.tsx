import { Draggable } from '@hello-pangea/dnd';
import { useState } from 'react';
import type { KanbanBoardCard } from '@/types/kanban';
import { calculateChecklistProgress, formatDate } from '@/utils/kanban';
import CheckIcon from '@public/icons/small/check.svg';
import CheckboxIcon from '@public/icons/small/checkbox.svg';
import CommentIcon from '@public/icons/small/comment.svg';
import DescIcon from '@public/icons/small/description.svg';
import PaperclipIcon from '@public/icons/small/paperclip.svg';
import ClockIcon from '@public/icons/small/time.svg';
import { AvatarStack } from './AvatarStack';
import { TagBadge } from './TagBadge';

interface KanbanCardProps {
  card: KanbanBoardCard;
  boardId: string;
  index: number;
  onToggleDone: (boardId: string, cardId: string) => void;
  onClick: () => void;
  onDeleteCard: (boardId: string, cardId: string) => void;
}

export const KanbanCard = ({
  card,
  boardId,
  index,
  onToggleDone,
  onClick,
  onDeleteCard,
}: KanbanCardProps) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const detail = card.detail;
  if (!detail) return null;

  const checklistProgress = calculateChecklistProgress(detail.checklists);
  const commentsCount = detail.comments?.length || 0;
  const hasDueDate = !!detail.dates?.kanban_board_card_due_date;

  return (
    <>
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-dark-border bg-dark-surface-2 p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-2 text-normal font-semibold text-white">
              Delete Card
            </h3>
            <p className="mb-6 text-small leading-relaxed text-white/60">
              Are you sure you want to delete{' '}
              <strong className="font-semibold text-white">
                "{detail.kanban_board_card_title}"
              </strong>
              ? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(false);
                }}
                className="rounded-lg px-4 py-2 text-small font-medium text-white/50 transition hover:bg-white/10 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteCard(boardId, card.kanban_board_card_id);
                  setShowDeleteConfirm(false);
                }}
                className="rounded-lg border border-accent-red/20 bg-accent-red/15 px-4 py-2 text-small font-medium text-accent-red transition hover:bg-accent-red/30"
              >
                Yes, delete it
              </button>
            </div>
          </div>
        </div>
      )}
      <Draggable draggableId={String(card.kanban_board_card_id)} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            onClick={onClick}
            className={`group cursor-pointer rounded-lg p-3 ${
              snapshot.isDragging
                ? 'z-50 rotate-2 bg-dark-surface-2 shadow-2xl ring-1 ring-accent-blue/50'
                : 'bg-dark-surface-3 transition-all hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)]'
            }`}
          >
            {/* Title row */}
            <div className="mb-2 flex items-start justify-between gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleDone(boardId, card.kanban_board_card_id);
                  }}
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                    detail.is_completed
                      ? 'border-accent-blue bg-accent-blue'
                      : 'border-dark-secondary hover:border-dark-primary'
                  }`}
                >
                  {detail.is_completed && (
                    <CheckIcon className="h-2 w-2 text-dark-primary" />
                  )}
                </button>
                <span
                  className={`text-small leading-snug font-medium ${
                    detail.is_completed
                      ? 'text-white/30 line-through'
                      : 'text-white/90'
                  }`}
                >
                  {detail.kanban_board_card_title}
                </span>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(true);
                }}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-white/0 transition-all group-hover:text-white/30 hover:bg-accent-red/10 hover:text-accent-red!"
                title="Delete card"
              >
                ✕
              </button>
            </div>

            {/* Meta badges */}
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xsmall font-medium text-dark-primary">
              {detail.kanban_board_card_description && (
                <span
                  className="flex items-center gap-1"
                  title="Has description"
                >
                  <DescIcon className="h-4 w-4" />
                </span>
              )}
              {!!detail.attachments?.length && (
                <span
                  className="flex items-center gap-1"
                  title="Has attachments"
                >
                  <PaperclipIcon className="h-4 w-4" />
                </span>
              )}
              {hasDueDate && (
                <span className="flex items-center gap-1">
                  <ClockIcon className="h-4 w-4" />
                  {formatDate(detail.dates!.kanban_board_card_due_date)}
                </span>
              )}
              {checklistProgress.total > 0 && (
                <span className="flex items-center gap-1">
                  <CheckboxIcon className="h-4 w-4" />
                  {checklistProgress.done}/{checklistProgress.total}
                </span>
              )}
              {commentsCount > 0 && (
                <span className="flex items-center gap-1">
                  <CommentIcon className="h-4 w-4" />
                  {commentsCount}
                </span>
              )}
            </div>

            {/* Labels */}
            {!!detail.labels?.length && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {detail.labels.map((label) =>
                  label.color ? (
                    <TagBadge
                      key={label.card_label_id}
                      label={label.card_label_name}
                      color={label.color}
                    />
                  ) : null,
                )}
              </div>
            )}

            <AvatarStack members={detail.members} />
          </div>
        )}
      </Draggable>
    </>
  );
};
