import React from 'react';
import type { KanbanBoardCardDetail, KanbanUser } from '@/types/kanban';
import type { LocalAttachment} from '@/utils/attachmentStorage';
import { formatBytes, getFileEmoji } from '@/utils/attachmentStorage';
import { calculateChecklistProgress, generateInitials, MEMBER_COLORS } from '@/utils/kanban';
import ArrowRightIcon from '@public/icons/small/arrow_left.svg';
import CloseIcon from '@public/icons/small/cancel.svg';
import CheckIcon from '@public/icons/small/check.svg';
import ChecklistIcon from '@public/icons/small/checkbox.svg';
import CommentIcon from '@public/icons/small/comment.svg';
import DescriptionIcon from '@public/icons/small/description.svg';
import PaperclipIcon from '@public/icons/small/paperclip.svg';
import CalendarIcon from '@public/icons/small/time.svg';
import { AvatarStack } from './AvatarStack';
import { SectionHeader } from './CardDetailComponents';
import { TagBadge } from './TagBadge';

export interface DescState {
    editing: boolean;
    value: string;
    ref: React.RefObject<HTMLTextAreaElement | null>;
    onEdit: () => void;
    onChange: (v: string) => void;
    onCommit: () => void;
    onDiscard: () => void;
}

export interface AttachmentState {
    local: LocalAttachment[];
    adding: boolean;
    uploading: boolean;
    dragOver: boolean;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    zoneRef: React.RefObject<HTMLDivElement | null>;
    onSetDragOver: (v: boolean) => void;
    onProcess: (files: FileList | File[]) => void;
    onDownload: (att: LocalAttachment) => void;
    onDelete: (id: string) => void;
    onCancel: () => void;
}

export interface ChecklistState {
    adding: boolean;
    newName: string;
    saving: boolean;
    newItems: Record<string, string>;
    onAdd: () => void;
    onNameChange: (v: string) => void;
    onCancel: () => void;
    onItemChange: (clId: string, v: string) => void;
    onAddItem: (clId: string) => void;
    onToggleItem: (clId: string, itemId: string, current: boolean) => void;
    onDeleteItem: (clId: string, itemId: string) => void;
    onDeleteChecklist: (clId: string) => void;
}

export interface CommentState {
    newComment: string;
    onChange: (v: string) => void;
    onSubmit: () => void;
    onDelete: (id: string) => void;
    onDiscard: () => void;
}

interface CardDetailBodyProps {
    detail: KanbanBoardCardDetail;
    currentUser: KanbanUser;
    isDueSoon: boolean;
    isOverdue: boolean;
    desc: DescState;
    attachments: AttachmentState;
    checklists: ChecklistState;
    comments: CommentState;
}

export const CardDetailBody = ({
    detail,
    currentUser,
    isDueSoon,
    isOverdue,
    desc,
    attachments,
    checklists,
    comments,
}: CardDetailBodyProps) => {
    // Destructure desc properties to avoid ref access warnings
    const {
        editing: descEditing,
        value: descValue,
        ref: descRef,
        onEdit: descOnEdit,
        onChange: descOnChange,
        onCommit: descOnCommit,
        onDiscard: descOnDiscard,
    } = desc;

    // Destructure attachments properties to avoid ref access warnings
    const {
        local: attachmentsLocal,
        adding: attachmentsAdding,
        uploading: attachmentsUploading,
        dragOver: attachmentsDragOver,
        fileInputRef: attachmentsFileInputRef,
        zoneRef: attachmentsZoneRef,
        onSetDragOver: attachmentsOnSetDragOver,
        onProcess: attachmentsOnProcess,
        onDownload: attachmentsOnDownload,
        onDelete: attachmentsOnDelete,
        onCancel: attachmentsOnCancel,
    } = attachments;

    // Destructure checklists properties
    const {
        adding: checklistsAdding,
        newName: checklistsNewName,
        saving: checklistsSaving,
        newItems: checklistsNewItems,
        onAdd: checklistsOnAdd,
        onNameChange: checklistsOnNameChange,
        onCancel: checklistsOnCancel,
        onItemChange: checklistsOnItemChange,
        onAddItem: checklistsOnAddItem,
        onToggleItem: checklistsOnToggleItem,
        onDeleteItem: checklistsOnDeleteItem,
        onDeleteChecklist: checklistsOnDeleteChecklist,
    } = checklists;

    // Destructure comments properties
    const {
        newComment: commentsNewComment,
        onChange: commentsOnChange,
        onSubmit: commentsOnSubmit,
        onDelete: commentsOnDelete,
        onDiscard: commentsOnDiscard,
    } = comments;

    const totalAttachments = attachmentsLocal.length + (detail.attachments?.length || 0);

    return (
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4 min-w-0 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-dark-surface-3 hover:[&::-webkit-scrollbar-thumb]:bg-dark-secondary [&::-webkit-scrollbar-thumb]:rounded-full">

            {/* Labels row */}
            {!!detail.labels?.length && (
                <div className="flex flex-wrap gap-1.5">
                    {detail.labels.map((label) =>
                        label.color ? (
                            <TagBadge key={label.card_label_id} label={label.card_label_name} color={label.color} />
                        ) : null
                    )}
                </div>
            )}

            {/* Members row */}
            {!!detail.members?.length && (
                <div className="flex items-center gap-2">
                    <AvatarStack members={detail.members} />
                    <span className="text-xsmall text-white/30">
                        {detail.members.length} member{detail.members.length !== 1 ? 's' : ''}
                    </span>
                </div>
            )}

            {/* Dates summary */}
            {(detail.dates?.kanban_board_card_start_date || detail.dates?.kanban_board_card_due_date) && (
                <div className="flex items-center gap-4">
                    {detail.dates?.kanban_board_card_start_date && (
                        <div className="flex items-center gap-1.5">
                            <CalendarIcon className="w-3.5 h-3.5 text-white/30" />
                            <span className="text-xsmall text-white/40">Start</span>
                            <span className="text-xsmall font-medium text-white/60">
                                {new Date(detail.dates.kanban_board_card_start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                        </div>
                    )}
                    {detail.dates?.kanban_board_card_due_date && (
                        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md ${
                            isOverdue
                                ? 'bg-accent-red/15 border border-accent-red/30'
                                : isDueSoon
                                ? 'bg-accent-yellow/15 border border-accent-yellow/30'
                                : 'bg-dark-surface-2 border border-dark-border'
                        }`}>
                            <CalendarIcon className={`w-3.5 h-3.5 ${isOverdue ? 'text-accent-red' : isDueSoon ? 'text-accent-yellow' : 'text-white/30'}`} />
                            <span className={`text-xsmall font-medium ${isOverdue ? 'text-accent-red' : isDueSoon ? 'text-accent-yellow' : 'text-white/60'}`}>
                                {isOverdue ? 'Overdue · ' : isDueSoon ? 'Due soon · ' : ''}
                                {new Date(detail.dates.kanban_board_card_due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Description */}
            <div>
                <SectionHeader
                    icon={<DescriptionIcon className="w-4 h-4" />}
                    label="Description"
                    action={
                        !descEditing && (
                            <button
                                onClick={descOnEdit}
                                className="text-xsmall text-dark-secondary hover:text-dark-primary transition px-2 py-0.5 rounded hover:bg-dark-surface-3"
                            >
                                Edit
                            </button>
                        )
                    }
                />
                {descEditing ? (
                    <div>
                        <textarea
                            ref={descRef}
                            value={descValue}
                            onChange={(e) => descOnChange(e.target.value)}
                            rows={5}
                            placeholder="Add a more detailed description..."
                            className="w-full bg-dark-surface-2 border border-dark-border-focus rounded-xl px-3.5 py-3 text-small text-dark-primary placeholder-white/20 focus:outline-none resize-none leading-relaxed [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-dark-surface-3 hover:[&::-webkit-scrollbar-thumb]:bg-dark-secondary [&::-webkit-scrollbar-thumb]:rounded-full"
                        />
                        <div className="flex gap-2 mt-2">
                            <button
                                onClick={descOnCommit}
                                className="px-3.5 py-1.5 bg-accent-blue rounded-lg text-xsmall font-semibold text-white hover:bg-opacity-90 transition"
                            >
                                Save
                            </button>
                            <button
                                onClick={descOnDiscard}
                                className="px-3.5 py-1.5 border border-dark-border rounded-lg text-xsmall text-white/50 hover:text-white hover:bg-white/5 transition"
                            >
                                Discard
                            </button>
                        </div>
                    </div>
                ) : (
                    <div
                        onClick={descOnEdit}
                        className="min-h-15 bg-dark-surface-2 hover:bg-dark-surface-3 rounded-xl px-3.5 py-3 text-small cursor-pointer transition leading-relaxed"
                    >
                        {detail.kanban_board_card_description ? (
                            <span className="text-white/70 whitespace-pre-wrap">{detail.kanban_board_card_description}</span>
                        ) : (
                            <span className="text-white/20">Add a more detailed description...</span>
                        )}
                    </div>
                )}
            </div>

            {/* Attachments */}
            {(totalAttachments > 0) && (
                <div>
                    <SectionHeader
                        icon={<PaperclipIcon className="w-4 h-4" />}
                        label={`Attachments (${totalAttachments})`}
                    />
                    <div className="space-y-2">
                        {detail.attachments?.map((att) => (
                            <a
                                key={att.kanban_board_card_attachment_id}
                                href={att.kanban_board_card_attachment_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 px-3.5 py-2.5 bg-dark-surface-2 hover:bg-dark-surface-3 rounded-xl text-small text-white/60 hover:text-white transition border border-dark-border group"
                            >
                                <span className="text-normal shrink-0">📎</span>
                                <span className="truncate flex-1">
                                    {att.kanban_board_card_attachment_name || att.kanban_board_card_attachment_url}
                                </span>
                                <ArrowRightIcon className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition shrink-0" />
                            </a>
                        ))}
                        {attachmentsLocal.map((att) => (
                            <div
                                key={att.id}
                                className="flex items-center gap-3 px-3.5 py-2.5 bg-dark-surface-2 rounded-xl border border-dark-border group/att"
                            >
                                {att.type.startsWith('image/') ? (
                                    <img
                                        src={att.dataUrl}
                                        alt={att.name}
                                        className="w-10 h-10 rounded-lg object-cover shrink-0 border border-dark-border"
                                    />
                                ) : (
                                    <span className="text-large shrink-0 w-10 text-center">{getFileEmoji(att.type)}</span>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-small text-white/70 truncate">{att.name}</p>
                                    <p className="text-xsmall text-white/25 mt-0.5">
                                        {formatBytes(att.size)} · {new Date(att.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover/att:opacity-100 transition shrink-0">
                                    <button
                                        onClick={() => attachmentsOnDownload(att)}
                                        className="w-7 h-7 flex items-center justify-center rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition text-xsmall"
                                        title="Download"
                                    >
                                        ↓
                                    </button>
                                    <button
                                        onClick={() => attachmentsOnDelete(att.id)}
                                        className="w-7 h-7 flex items-center justify-center rounded-lg text-white/30 hover:text-accent-red hover:bg-accent-red/10 transition"
                                        title="Delete"
                                    >
                                        <CloseIcon className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Upload drop zone */}
            {attachmentsAdding && (
                <div ref={attachmentsZoneRef} className="space-y-2 p-4 bg-dark-surface-2 rounded-xl border border-dark-border">
                    <p className="text-xsmall font-semibold text-white/40 mb-2">Add attachment</p>
                    <div
                        onDragOver={(e) => {
                            e.preventDefault(); attachmentsOnSetDragOver(true);
                        }}
                        onDragLeave={() => attachmentsOnSetDragOver(false)}
                        onDrop={(e) => {
                            e.preventDefault(); attachmentsOnSetDragOver(false); attachmentsOnProcess(e.dataTransfer.files);
                        }}
                        onClick={() => attachmentsFileInputRef.current?.click()}
                        className={`w-full flex flex-col items-center justify-center gap-2 py-6 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                            attachmentsDragOver
                                ? 'border-accent-blue bg-accent-blue/10 text-accent-blue'
                                : 'border-dark-border hover:border-dark-border-focus text-white/25 hover:text-white/40'
                        }`}
                    >
                        <PaperclipIcon className="w-5 h-5" />
                        <p className="text-xsmall text-center">
                            {attachmentsUploading ? 'Uploading...' : 'Drop file here or click to select'}
                        </p>
                        <p className="text-xsmall text-white/20">Max 20 MB per file</p>
                    </div>
                    <input
                        ref={attachmentsFileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                            if (e.target.files) attachmentsOnProcess(e.target.files); e.target.value = '';
                        }}
                    />
                    <button
                        onClick={attachmentsOnCancel}
                        className="px-3.5 py-1.5 border border-dark-border rounded-lg text-xsmall text-white/40 hover:text-white hover:bg-white/5 transition"
                    >
                        Cancel
                    </button>
                </div>
            )}

            {/* Checklists */}
            {(detail.checklists || []).map((checklist) => {
                const prog = calculateChecklistProgress([checklist]);
                const pct = prog.total > 0 ? Math.round((prog.done / prog.total) * 100) : 0;

                return (
                    <div key={checklist.kanban_board_card_checklist_id}>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <ChecklistIcon className="w-4 h-4 text-white/30" />
                                <span className="text-xsmall font-semibold text-white/50 uppercase tracking-wider">
                                    {checklist.kanban_board_card_checklist_name}
                                </span>
                            </div>
                            <button
                                onClick={() => checklistsOnDeleteChecklist(checklist.kanban_board_card_checklist_id)}
                                className="text-xsmall text-white/20 hover:text-accent-red transition px-2 py-0.5 rounded hover:bg-accent-red/10"
                            >
                                Delete
                            </button>
                        </div>

                        {prog.total > 0 && (
                            <div className="flex items-center gap-2.5 mb-3">
                                <span className="text-xsmall text-white/30 w-7 text-right tabular-nums">{pct}%</span>
                                <div className="flex-1 bg-dark-surface-2 rounded-full h-1.5 overflow-hidden">
                                    <div
                                        className={`h-1.5 rounded-full transition-all duration-500 ${pct === 100 ? 'bg-accent-green' : 'bg-accent-blue'}`}
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                                <span className="text-xsmall text-white/20 tabular-nums">{prog.done}/{prog.total}</span>
                            </div>
                        )}

                        <div className="space-y-1">
                            {(checklist.items || []).map((item) => (
                                <div
                                    key={item.kanban_board_card_checklist_item_id}
                                    className="flex items-center gap-3 group/item px-1 py-1 rounded-lg hover:bg-white/3 transition"
                                >
                                    <button
                                        onClick={() => checklistsOnToggleItem(
                                            checklist.kanban_board_card_checklist_id,
                                            item.kanban_board_card_checklist_item_id,
                                            item.is_completed
                                        )}
                                        className={`shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                                            item.is_completed
                                                ? 'bg-accent-blue border-accent-blue'
                                                : 'border-white/20 hover:border-accent-blue'
                                        }`}
                                    >
                                        {item.is_completed && <CheckIcon className="w-2 h-2 text-white" />}
                                    </button>
                                    <span className={`flex-1 text-small leading-snug transition-all ${
                                        item.is_completed ? 'line-through text-white/25' : 'text-white/75'
                                    }`}>
                                        {item.kanban_board_card_checklist_item_name}
                                    </span>
                                    <button
                                        onClick={() => checklistsOnDeleteItem(
                                            checklist.kanban_board_card_checklist_id,
                                            item.kanban_board_card_checklist_item_id
                                        )}
                                        className="opacity-0 group-hover/item:opacity-100 text-white/20 hover:text-accent-red transition text-xsmall w-5 h-5 flex items-center justify-center rounded"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-2 mt-2.5 pl-1">
                            <input
                                value={checklistsNewItems[checklist.kanban_board_card_checklist_id] || ''}
                                onChange={(e) => checklistsOnItemChange(checklist.kanban_board_card_checklist_id, e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') checklistsOnAddItem(checklist.kanban_board_card_checklist_id);
                                }}
                                placeholder="Add an item..."
                                className="flex-1 bg-dark-surface-2 border border-dark-secondary rounded-lg px-3 py-1.5 text-small text-dark-primary placeholder-dark-secondary focus:outline-none focus:border-dark-surface-3 transition"
                            />
                            <button
                                onClick={() => checklistsOnAddItem(checklist.kanban_board_card_checklist_id)}
                                className="px-3 py-1.5 bg-dark-surface-2 hover:bg-dark-surface-3 rounded-lg text-small text-white/50 hover:text-white transition border border-dark-secondary"
                            >
                                Add
                            </button>
                        </div>
                    </div>
                );
            })}

            {/* Add checklist form */}
            {checklistsAdding && (
                <div className="space-y-2 p-4 bg-dark-surface-2 rounded-xl border border-dark-border">
                    <p className="text-xsmall font-semibold text-white/40 mb-2">New checklist</p>
                    <input
                        autoFocus
                        value={checklistsNewName}
                        onChange={(e) => checklistsOnNameChange(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') checklistsOnAdd();
                            if (e.key === 'Escape') checklistsOnCancel();
                        }}
                        placeholder="Checklist title..."
                        className="w-full bg-dark-surface-1 border border-dark-border-focus rounded-lg px-3 py-2 text-small text-white placeholder-white/20 focus:outline-none"
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={checklistsOnAdd}
                            disabled={checklistsSaving}
                            className="px-3.5 py-1.5 bg-accent-blue rounded-lg text-xsmall font-semibold text-white hover:bg-opacity-90 disabled:opacity-50 transition"
                        >
                            Add Checklist
                        </button>
                        <button
                            onClick={checklistsOnCancel}
                            className="px-3.5 py-1.5 border border-dark-border rounded-lg text-xsmall text-white/40 hover:text-white hover:bg-white/5 transition"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <div className="border-t border-dark-border" />

            {/* Comments */}
            <div>
                <SectionHeader icon={<CommentIcon className="w-4 h-4" />} label="Activity" />

                <div className="flex gap-3 mb-3 mt-4">
                    <div
                        className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-xsmall font-bold text-white"
                        style={{ backgroundColor: MEMBER_COLORS[0] }}
                    >
                        {generateInitials(currentUser.name)}
                    </div>
                    <div className="flex-1">
                        <textarea
                            value={commentsNewComment}
                            onChange={(e) => commentsOnChange(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault(); commentsOnSubmit();
                                }
                            }}
                            placeholder="Write a comment... (Enter to send)"
                            rows={commentsNewComment ? 3 : 2}
                            className="w-full bg-dark-surface-2 border border-dark-border rounded-xl px-3.5 py-2.5 text-small text-white placeholder-white/20 focus:outline-none focus:border-dark-border-focus resize-none transition-all"
                        />
                        {commentsNewComment.trim() && (
                            <div className="flex gap-2 mt-2">
                                <button
                                    onClick={commentsOnSubmit}
                                    className="px-3.5 py-1.5 bg-accent-blue rounded-lg text-xsmall font-semibold text-white hover:bg-opacity-90 transition"
                                >
                                    Save
                                </button>
                                <button
                                    onClick={commentsOnDiscard}
                                    className="px-3.5 py-1.5 border border-dark-border rounded-lg text-xsmall text-white/40 hover:text-white hover:bg-white/5 transition"
                                >
                                    Discard
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    {(detail.comments || []).map((comment, i) => (
                        <div key={comment.kanban_board_card_comment_id} className="flex gap-3 group/comment">
                            <div
                                className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-xsmall font-bold text-white"
                                style={{
                                    backgroundColor: MEMBER_COLORS[
                                        (typeof comment.kanban_board_card_comment_from === 'number'
                                            ? comment.kanban_board_card_comment_from
                                            : i) % MEMBER_COLORS.length
                                    ],
                                }}
                            >
                                {generateInitials(comment.user?.name || 'U')}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xsmall font-semibold text-white/70">
                                        {comment.user?.name || 'User'}
                                    </span>
                                    <span className="text-xsmall text-white/20">
                                        {new Date(comment.created_at).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </span>
                                </div>
                                <div className="bg-dark-surface-3 rounded-xl px-3.5 py-2.5 text-small text-white/65 leading-relaxed">
                                    {comment.kanban_board_card_comment_message}
                                </div>
                            </div>
                            {comment.kanban_board_card_comment_from === currentUser.id && (
                                <button
                                    onClick={() => commentsOnDelete(comment.kanban_board_card_comment_id)}
                                    className="opacity-0 group-hover/comment:opacity-100 text-white/20 hover:text-accent-red transition text-xsmall self-start mt-2 w-5 h-5 flex items-center justify-center rounded"
                                >
                                    <CloseIcon />
                                </button>
                            )}
                        </div>
                    ))}
                    {!detail.comments?.length && (
                        <p className="text-xsmall text-white/15 text-center py-4">No activity yet</p>
                    )}
                </div>
            </div>

            <div className="h-6" />
        </div>
    );
};
