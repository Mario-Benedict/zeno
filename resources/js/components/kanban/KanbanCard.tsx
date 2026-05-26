import { Draggable } from '@hello-pangea/dnd';
import { useState } from 'react';
import CheckIcon from '@public/icons/small/check.svg';
import CheckboxIcon from '@public/icons/small/checkbox.svg';
import CommentIcon from '@public/icons/small/comment.svg';
import DescIcon from '@public/icons/small/description.svg';
import PaperclipIcon from '@public/icons/small/paperclip.svg';
import ClockIcon from '@public/icons/small/time.svg';
import { AvatarStack } from './AvatarStack';
import { TagBadge } from './TagBadge';
import type { KanbanBoardCard } from './types';
import { calculateChecklistProgress, formatDate } from './utils';

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
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div
                        className="bg-dark-surface-2 border border-dark-border rounded-xl p-5 w-full max-w-sm shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-normal font-semibold text-white mb-2">Delete Card</h3>
                        <p className="text-small text-white/60 mb-6 leading-relaxed">
                            Are you sure you want to delete{' '}
                            <strong className="text-white font-semibold">"{detail.kanban_board_card_title}"</strong>?
                            This action cannot be undone.
                        </p>
                        <div className="flex items-center justify-end gap-3">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation(); setShowDeleteConfirm(false); 
                                }}
                                className="px-4 py-2 rounded-lg text-small font-medium text-white/50 hover:text-white hover:bg-white/10 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteCard(boardId, card.kanban_board_card_id);
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
            <Draggable draggableId={String(card.kanban_board_card_id)} index={index}>
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        onClick={onClick}
                        className={`rounded-lg p-3 cursor-pointer group ${
                            snapshot.isDragging
                                ? 'bg-dark-surface-2 shadow-2xl rotate-2 z-50 ring-1 ring-accent-blue/50'
                                : 'bg-dark-surface-3 transition-all hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)]'
                        }`}
                    >
                        {/* Title row */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleDone(boardId, card.kanban_board_card_id);
                                    }}
                                    className={`shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                                        detail.is_completed
                                            ? 'bg-accent-blue border-accent-blue'
                                            : 'border-dark-secondary hover:border-dark-primary'
                                    }`}
                                >
                                    {detail.is_completed && <CheckIcon className="w-2 h-2 text-dark-primary" />}
                                </button>
                                <span
                                    className={`text-small font-medium leading-snug ${
                                        detail.is_completed ? 'line-through text-white/30' : 'text-white/90'
                                    }`}
                                >
                                    {detail.kanban_board_card_title}
                                </span>
                            </div>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation(); setShowDeleteConfirm(true); 
                                }}
                                className="shrink-0 w-5 h-5 rounded flex items-center justify-center text-white/0 group-hover:text-white/30 hover:text-accent-red! hover:bg-accent-red/10 transition-all"
                                title="Delete card"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Meta badges */}
                        <div className="flex items-center gap-2 text-dark-primary text-xsmall font-medium mb-2 flex-wrap">
                            {detail.kanban_board_card_description && (
                                <span className="flex items-center gap-1" title="Has description">
                                    <DescIcon className="h-4 w-4" />
                                </span>
                            )}
                            {!!detail.attachments?.length && (
                                <span className="flex items-center gap-1" title="Has attachments">
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
                            <div className="flex flex-wrap gap-1.5 mb-2">
                                {detail.labels.map((label) =>
                                    label.color ? (
                                        <TagBadge
                                            key={label.card_label_id}
                                            label={label.card_label_name}
                                            color={label.color}
                                        />
                                    ) : null
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
