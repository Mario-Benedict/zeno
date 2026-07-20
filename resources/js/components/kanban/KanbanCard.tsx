import { Draggable } from '@hello-pangea/dnd';
import { useState } from 'react';
import ConfirmModal from '@/components/shared/ConfirmModal';
import { useTranslation } from '@/hooks/useTranslation';
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
  canEdit: boolean;
  onToggleDone: (boardId: string, cardId: string) => void;
  onClick: () => void;
  onDeleteCard: (boardId: string, cardId: string) => void;
}

export const KanbanCard = ({
  card,
  boardId,
  index,
  canEdit,
  onToggleDone,
  onClick,
  onDeleteCard,
}: KanbanCardProps) => {
  const { t } = useTranslation();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const checklistProgress = calculateChecklistProgress(card.checklists);
  const commentsCount = card.comments?.length || 0;
  const hasDueDate = !!card.kanban_board_card_due_date;

  return (
    <>
      {canEdit && showDeleteConfirm && (
        <ConfirmModal
          title={t('kanban.deleteCardTitle')}
          description={t('kanban.deleteCardDescription', {
            title: card.kanban_board_card_title,
          })}
          confirmLabel={t('kanban.deleteCardConfirm')}
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={() => {
            onDeleteCard(boardId, card.kanban_board_card_id);
            setShowDeleteConfirm(false);
          }}
        />
      )}
      <Draggable
        draggableId={String(card.kanban_board_card_id)}
        index={index}
        isDragDisabled={!canEdit}
      >
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            data-card-id={card.kanban_board_card_id}
            style={{
              ...provided.draggableProps.style,
              ...(snapshot.isDropAnimating && { transitionDuration: '0.001s' }),
            }}
            onClick={onClick}
            className={`group cursor-pointer rounded-lg p-3 ${
              snapshot.isDragging
                ? 'z-50 rotate-2 bg-dark-surface-2 shadow-2xl ring-1 ring-accent-blue/50'
                : 'bg-dark-surface-3 transition-all hover:-translate-y-px hover:shadow-[0_8px_24px] hover:shadow-black/40'
            }`}
          >
            {/* Title row */}
            <div className="mb-2 flex items-start justify-between gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <button
                  type="button"
                  disabled={!canEdit}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!canEdit) return;
                    onToggleDone(boardId, card.kanban_board_card_id);
                  }}
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                    card.is_completed
                      ? 'border-accent-blue bg-accent-blue'
                      : 'border-dark-secondary hover:border-dark-primary'
                  }`}
                >
                  {card.is_completed && (
                    <CheckIcon className="h-2 w-2 text-dark-primary" />
                  )}
                </button>
                <span
                  className={`text-small leading-snug font-medium ${
                    card.is_completed
                      ? 'text-dark-secondary/80 line-through'
                      : 'text-dark-primary'
                  }`}
                >
                  {card.kanban_board_card_title}
                </span>
              </div>

              {canEdit && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteConfirm(true);
                  }}
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-white/0 transition-all group-hover:text-dark-secondary/80 hover:bg-accent-red/10 hover:text-accent-red!"
                  title={t('kanban.deleteCard')}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Meta badges */}
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xsmall font-medium text-dark-primary">
              {card.kanban_board_card_description && (
                <span
                  className="flex items-center gap-1"
                  title={t('kanban.hasDescription')}
                >
                  <DescIcon className="h-4 w-4" />
                </span>
              )}
              {!!card.attachments?.length && (
                <span
                  className="flex items-center gap-1"
                  title={t('kanban.hasAttachments')}
                >
                  <PaperclipIcon className="h-4 w-4" />
                </span>
              )}
              {hasDueDate && (
                <span className="flex items-center gap-1">
                  <ClockIcon className="h-4 w-4" />
                  {formatDate(card.kanban_board_card_due_date)}
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
            {!!card.labels?.length && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {card.labels.map((label) => (
                  <TagBadge
                    key={label.card_label_id}
                    label={label.card_label_name}
                    colorHex={label.card_label_color_hex}
                  />
                ))}
              </div>
            )}

            <AvatarStack members={card.members} />
          </div>
        )}
      </Draggable>
    </>
  );
};
