import React from 'react';
import { formatFileSize } from '@/lib/utils';
import type { KanbanBoardCardDetail, KanbanUser } from '@/types/kanban';
import type { LocalAttachment } from '@/utils/attachmentStorage';
import { getFileEmoji } from '@/utils/attachmentStorage';
import {
  calculateChecklistProgress,
  generateInitials,
  MEMBER_COLORS,
} from '@/utils/kanban';
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

  const totalAttachments =
    attachmentsLocal.length + (detail.attachments?.length || 0);

  return (
    <div className="min-w-0 flex-1 space-y-4 overflow-y-auto px-3 py-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-dark-surface-3 hover:[&::-webkit-scrollbar-thumb]:bg-dark-secondary [&::-webkit-scrollbar-track]:bg-transparent">
      {/* Labels row */}
      {!!detail.labels?.length && (
        <div className="flex flex-wrap gap-1.5">
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

      {/* Members row */}
      {!!detail.members?.length && (
        <div className="flex items-center gap-2">
          <AvatarStack members={detail.members} />
          <span className="text-xsmall text-white/30">
            {detail.members.length} member
            {detail.members.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Dates summary */}
      {(detail.dates?.kanban_board_card_start_date ||
        detail.dates?.kanban_board_card_due_date) && (
        <div className="flex items-center gap-4">
          {detail.dates?.kanban_board_card_start_date && (
            <div className="flex items-center gap-1.5">
              <CalendarIcon className="h-3.5 w-3.5 text-white/30" />
              <span className="text-xsmall text-white/40">Start</span>
              <span className="text-xsmall font-medium text-white/60">
                {new Date(
                  detail.dates.kanban_board_card_start_date,
                ).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          )}
          {detail.dates?.kanban_board_card_due_date && (
            <div
              className={`flex items-center gap-1.5 rounded-md px-2 py-0.5 ${
                isOverdue
                  ? 'border border-accent-red/30 bg-accent-red/15'
                  : isDueSoon
                    ? 'border border-accent-yellow/30 bg-accent-yellow/15'
                    : 'border border-dark-border bg-dark-surface-2'
              }`}
            >
              <CalendarIcon
                className={`h-3.5 w-3.5 ${isOverdue ? 'text-accent-red' : isDueSoon ? 'text-accent-yellow' : 'text-white/30'}`}
              />
              <span
                className={`text-xsmall font-medium ${isOverdue ? 'text-accent-red' : isDueSoon ? 'text-accent-yellow' : 'text-white/60'}`}
              >
                {isOverdue ? 'Overdue · ' : isDueSoon ? 'Due soon · ' : ''}
                {new Date(
                  detail.dates.kanban_board_card_due_date,
                ).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Description */}
      <div>
        <SectionHeader
          icon={<DescriptionIcon className="h-4 w-4" />}
          label="Description"
          action={
            !descEditing && (
              <button
                onClick={descOnEdit}
                className="rounded px-2 py-0.5 text-xsmall text-dark-secondary transition hover:bg-dark-surface-3 hover:text-dark-primary"
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
              className="w-full resize-none rounded-xl border border-dark-border-focus bg-dark-surface-2 px-3.5 py-3 text-small leading-relaxed text-dark-primary placeholder-white/20 focus:outline-none [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-dark-surface-3 hover:[&::-webkit-scrollbar-thumb]:bg-dark-secondary [&::-webkit-scrollbar-track]:bg-transparent"
            />
            <div className="mt-2 flex gap-2">
              <button
                onClick={descOnCommit}
                className="hover:bg-opacity-90 rounded-lg bg-accent-blue px-3.5 py-1.5 text-xsmall font-semibold text-white transition"
              >
                Save
              </button>
              <button
                onClick={descOnDiscard}
                className="rounded-lg border border-dark-border px-3.5 py-1.5 text-xsmall text-white/50 transition hover:bg-white/5 hover:text-white"
              >
                Discard
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={descOnEdit}
            className="min-h-15 cursor-pointer rounded-xl bg-dark-surface-2 px-3.5 py-3 text-small leading-relaxed transition hover:bg-dark-surface-3"
          >
            {detail.kanban_board_card_description ? (
              <span className="whitespace-pre-wrap text-white/70">
                {detail.kanban_board_card_description}
              </span>
            ) : (
              <span className="text-white/20">
                Add a more detailed description...
              </span>
            )}
          </div>
        )}
      </div>

      {/* Attachments */}
      {totalAttachments > 0 && (
        <div>
          <SectionHeader
            icon={<PaperclipIcon className="h-4 w-4" />}
            label={`Attachments (${totalAttachments})`}
          />
          <div className="space-y-2">
            {detail.attachments?.map((att) => (
              <a
                key={att.kanban_board_card_attachment_id}
                href={att.kanban_board_card_attachment_url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 rounded-xl border border-dark-border bg-dark-surface-2 px-3.5 py-2.5 text-small text-white/60 transition hover:bg-dark-surface-3 hover:text-white"
              >
                <span className="shrink-0 text-normal">📎</span>
                <span className="flex-1 truncate">
                  {att.kanban_board_card_attachment_name ||
                    att.kanban_board_card_attachment_url}
                </span>
                <ArrowRightIcon className="h-3.5 w-3.5 shrink-0 opacity-0 transition group-hover:opacity-100" />
              </a>
            ))}
            {attachmentsLocal.map((att) => (
              <div
                key={att.id}
                className="group/att flex items-center gap-3 rounded-xl border border-dark-border bg-dark-surface-2 px-3.5 py-2.5"
              >
                {att.type.startsWith('image/') ? (
                  <img
                    src={att.dataUrl}
                    alt={att.name}
                    className="h-10 w-10 shrink-0 rounded-lg border border-dark-border object-cover"
                  />
                ) : (
                  <span className="w-10 shrink-0 text-center text-large">
                    {getFileEmoji(att.type)}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-small text-white/70">
                    {att.name}
                  </p>
                  <p className="mt-0.5 text-xsmall text-white/25">
                    {formatFileSize(att.size)} ·{' '}
                    {new Date(att.uploadedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover/att:opacity-100">
                  <button
                    onClick={() => attachmentsOnDownload(att)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-xsmall text-white/30 transition hover:bg-white/10 hover:text-white"
                    title="Download"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => attachmentsOnDelete(att.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-white/30 transition hover:bg-accent-red/10 hover:text-accent-red"
                    title="Delete"
                  >
                    <CloseIcon className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload drop zone */}
      {attachmentsAdding && (
        <div
          ref={attachmentsZoneRef}
          className="space-y-2 rounded-xl border border-dark-border bg-dark-surface-2 p-4"
        >
          <p className="mb-2 text-xsmall font-semibold text-white/40">
            Add attachment
          </p>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              attachmentsOnSetDragOver(true);
            }}
            onDragLeave={() => attachmentsOnSetDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              attachmentsOnSetDragOver(false);
              attachmentsOnProcess(e.dataTransfer.files);
            }}
            onClick={() => attachmentsFileInputRef.current?.click()}
            className={`flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-6 transition-all ${
              attachmentsDragOver
                ? 'border-accent-blue bg-accent-blue/10 text-accent-blue'
                : 'border-dark-border text-white/25 hover:border-dark-border-focus hover:text-white/40'
            }`}
          >
            <PaperclipIcon className="h-5 w-5" />
            <p className="text-center text-xsmall">
              {attachmentsUploading
                ? 'Uploading...'
                : 'Drop file here or click to select'}
            </p>
            <p className="text-xsmall text-white/20">Max 20 MB per file</p>
          </div>
          <input
            ref={attachmentsFileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) attachmentsOnProcess(e.target.files);
              e.target.value = '';
            }}
          />
          <button
            onClick={attachmentsOnCancel}
            className="rounded-lg border border-dark-border px-3.5 py-1.5 text-xsmall text-white/40 transition hover:bg-white/5 hover:text-white"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Checklists */}
      {(detail.checklists || []).map((checklist) => {
        const prog = calculateChecklistProgress([checklist]);
        const pct =
          prog.total > 0 ? Math.round((prog.done / prog.total) * 100) : 0;

        return (
          <div key={checklist.kanban_board_card_checklist_id}>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ChecklistIcon className="h-4 w-4 text-white/30" />
                <span className="text-xsmall font-semibold tracking-wider text-white/50 uppercase">
                  {checklist.kanban_board_card_checklist_name}
                </span>
              </div>
              <button
                onClick={() =>
                  checklistsOnDeleteChecklist(
                    checklist.kanban_board_card_checklist_id,
                  )
                }
                className="rounded px-2 py-0.5 text-xsmall text-white/20 transition hover:bg-accent-red/10 hover:text-accent-red"
              >
                Delete
              </button>
            </div>

            {prog.total > 0 && (
              <div className="mb-3 flex items-center gap-2.5">
                <span className="w-7 text-right text-xsmall text-white/30 tabular-nums">
                  {pct}%
                </span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-dark-surface-2">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-500 ${pct === 100 ? 'bg-accent-green' : 'bg-accent-blue'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xsmall text-white/20 tabular-nums">
                  {prog.done}/{prog.total}
                </span>
              </div>
            )}

            <div className="space-y-1">
              {(checklist.items || []).map((item) => (
                <div
                  key={item.kanban_board_card_checklist_item_id}
                  className="group/item flex items-center gap-3 rounded-lg px-1 py-1 transition hover:bg-white/3"
                >
                  <button
                    onClick={() =>
                      checklistsOnToggleItem(
                        checklist.kanban_board_card_checklist_id,
                        item.kanban_board_card_checklist_item_id,
                        item.is_completed,
                      )
                    }
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-all ${
                      item.is_completed
                        ? 'border-accent-blue bg-accent-blue'
                        : 'border-white/20 hover:border-accent-blue'
                    }`}
                  >
                    {item.is_completed && (
                      <CheckIcon className="h-2 w-2 text-white" />
                    )}
                  </button>
                  <span
                    className={`flex-1 text-small leading-snug transition-all ${
                      item.is_completed
                        ? 'text-white/25 line-through'
                        : 'text-white/75'
                    }`}
                  >
                    {item.kanban_board_card_checklist_item_name}
                  </span>
                  <button
                    onClick={() =>
                      checklistsOnDeleteItem(
                        checklist.kanban_board_card_checklist_id,
                        item.kanban_board_card_checklist_item_id,
                      )
                    }
                    className="flex h-5 w-5 items-center justify-center rounded text-xsmall text-white/20 opacity-0 transition group-hover/item:opacity-100 hover:text-accent-red"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-2.5 flex gap-2 pl-1">
              <input
                value={
                  checklistsNewItems[
                    checklist.kanban_board_card_checklist_id
                  ] || ''
                }
                onChange={(e) =>
                  checklistsOnItemChange(
                    checklist.kanban_board_card_checklist_id,
                    e.target.value,
                  )
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    checklistsOnAddItem(
                      checklist.kanban_board_card_checklist_id,
                    );
                  }
                }}
                placeholder="Add an item..."
                className="flex-1 rounded-lg border border-dark-secondary bg-dark-surface-2 px-3 py-1.5 text-small text-dark-primary placeholder-dark-secondary transition focus:border-dark-surface-3 focus:outline-none"
              />
              <button
                onClick={() =>
                  checklistsOnAddItem(checklist.kanban_board_card_checklist_id)
                }
                className="rounded-lg border border-dark-secondary bg-dark-surface-2 px-3 py-1.5 text-small text-white/50 transition hover:bg-dark-surface-3 hover:text-white"
              >
                Add
              </button>
            </div>
          </div>
        );
      })}

      {/* Add checklist form */}
      {checklistsAdding && (
        <div className="space-y-2 rounded-xl border border-dark-border bg-dark-surface-2 p-4">
          <p className="mb-2 text-xsmall font-semibold text-white/40">
            New checklist
          </p>
          <input
            autoFocus
            value={checklistsNewName}
            onChange={(e) => checklistsOnNameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') checklistsOnAdd();
              if (e.key === 'Escape') checklistsOnCancel();
            }}
            placeholder="Checklist title..."
            className="w-full rounded-lg border border-dark-border-focus bg-dark-surface-1 px-3 py-2 text-small text-white placeholder-white/20 focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              onClick={checklistsOnAdd}
              disabled={checklistsSaving}
              className="hover:bg-opacity-90 rounded-lg bg-accent-blue px-3.5 py-1.5 text-xsmall font-semibold text-white transition disabled:opacity-50"
            >
              Add Checklist
            </button>
            <button
              onClick={checklistsOnCancel}
              className="rounded-lg border border-dark-border px-3.5 py-1.5 text-xsmall text-white/40 transition hover:bg-white/5 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="border-t border-dark-border" />

      {/* Comments */}
      <div>
        <SectionHeader
          icon={<CommentIcon className="h-4 w-4" />}
          label="Activity"
        />

        <div className="mt-4 mb-3 flex gap-3">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xsmall font-bold text-white"
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
                  e.preventDefault();
                  commentsOnSubmit();
                }
              }}
              placeholder="Write a comment... (Enter to send)"
              rows={commentsNewComment ? 3 : 2}
              className="w-full resize-none rounded-xl border border-dark-border bg-dark-surface-2 px-3.5 py-2.5 text-small text-white placeholder-white/20 transition-all focus:border-dark-border-focus focus:outline-none"
            />
            {commentsNewComment.trim() && (
              <div className="mt-2 flex gap-2">
                <button
                  onClick={commentsOnSubmit}
                  className="hover:bg-opacity-90 rounded-lg bg-accent-blue px-3.5 py-1.5 text-xsmall font-semibold text-white transition"
                >
                  Save
                </button>
                <button
                  onClick={commentsOnDiscard}
                  className="rounded-lg border border-dark-border px-3.5 py-1.5 text-xsmall text-white/40 transition hover:bg-white/5 hover:text-white"
                >
                  Discard
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {(detail.comments || []).map((comment, i) => (
            <div
              key={comment.kanban_board_card_comment_id}
              className="group/comment flex gap-3"
            >
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xsmall font-bold text-white"
                style={{
                  backgroundColor:
                    MEMBER_COLORS[
                      (typeof comment.kanban_board_card_comment_from ===
                      'number'
                        ? comment.kanban_board_card_comment_from
                        : i) % MEMBER_COLORS.length
                    ],
                }}
              >
                {generateInitials(comment.user?.name || 'U')}
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
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
                <div className="rounded-xl bg-dark-surface-3 px-3.5 py-2.5 text-small leading-relaxed text-white/65">
                  {comment.kanban_board_card_comment_message}
                </div>
              </div>
              {comment.kanban_board_card_comment_from === currentUser.id && (
                <button
                  onClick={() =>
                    commentsOnDelete(comment.kanban_board_card_comment_id)
                  }
                  className="mt-2 flex h-5 w-5 items-center justify-center self-start rounded text-xsmall text-white/20 opacity-0 transition group-hover/comment:opacity-100 hover:text-accent-red"
                >
                  <CloseIcon />
                </button>
              )}
            </div>
          ))}
          {!detail.comments?.length && (
            <p className="py-4 text-center text-xsmall text-white/15">
              No activity yet
            </p>
          )}
        </div>
      </div>

      <div className="h-6" />
    </div>
  );
};
