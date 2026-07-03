import React, { useState } from 'react';
import { useRelativeTime } from '@/hooks/useRelativeTime';
import type { NoteDetail, NoteSaveStatus } from '@/types/notes';

const AVATAR_COLORS = ['bg-accent-red', 'bg-accent-orange', 'bg-accent-blue', 'bg-accent-purple', 'bg-status-success'];

const saveStatusLabel = (status: NoteSaveStatus, savedAtLabel: string): string => {
  switch (status) {
    case 'dirty':
      return 'Editing…';
    case 'saving':
      return 'Saving…';
    case 'error':
      return 'Save failed — retry';
    default:
      return savedAtLabel ? `Saved ${savedAtLabel}` : '';
  }
};

interface NoteEditorHeaderProps {
  note: NoteDetail;
  title: string;
  onTitleChange: (value: string) => void;
  onTitleBlur: () => void;
  canEdit: boolean;
  isOwner: boolean;
  saveStatus: NoteSaveStatus;
  savedAt: string | null;
  onlineUserIds: number[];
  onShareClick: () => void;
  onDeleteClick: () => void;
}

const NoteEditorHeader = ({
  note,
  title,
  onTitleChange,
  onTitleBlur,
  canEdit,
  isOwner,
  saveStatus,
  savedAt,
  onlineUserIds,
  onShareClick,
  onDeleteClick,
}: NoteEditorHeaderProps): React.ReactElement => {
  const [menuOpen, setMenuOpen] = useState(false);
  const savedAtLabel = useRelativeTime(savedAt);
  const statusLabel = saveStatusLabel(saveStatus, savedAtLabel);
  const statusColor = saveStatus === 'error' ? 'text-status-error' : 'text-dark-secondary';

  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <input
        value={title}
        onChange={(e) => canEdit && onTitleChange(e.target.value)}
        onBlur={canEdit ? onTitleBlur : undefined}
        readOnly={!canEdit}
        placeholder="Untitled"
        className={`box-border w-full min-w-0 flex-1 border-none bg-transparent p-0 font-sans text-h3 font-bold text-dark-primary outline-none placeholder:text-dark-secondary/40 ${!canEdit ? 'cursor-default' : ''}`}
      />

      <div className="flex shrink-0 items-center gap-3 pt-2">
        <span className={`text-xsmall whitespace-nowrap ${statusColor}`}>{statusLabel}</span>

        {note.isShared && note.collaborators.length > 0 && (
          <div className="flex -space-x-2">
            {note.collaborators.slice(0, 4).map((c, index) => (
              <div
                key={c.id}
                title={`${c.name} · ${c.canEdit ? 'Editor' : 'Viewer'}`}
                className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-xsmall font-bold text-white ${AVATAR_COLORS[index % AVATAR_COLORS.length]} ${
                  onlineUserIds.includes(c.id) ? 'border-status-success' : 'border-dark-surface-2'
                }`}
              >
                {c.name.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
        )}

        {isOwner && (
          <button
            type="button"
            onClick={onShareClick}
            className="rounded-lg bg-dark-surface-3 px-3 py-1.5 text-xsmall font-medium text-dark-primary hover:bg-dark-input-focus"
          >
            {note.isShared ? 'Share' : 'Share…'}
          </button>
        )}

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            title="More"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-dark-secondary hover:bg-dark-surface-3 hover:text-dark-primary"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="5" cy="12" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="19" cy="12" r="2" />
            </svg>
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute top-full right-0 z-20 mt-1 w-40 rounded-lg border border-dark-border bg-dark-surface-3 p-1 shadow-lg">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onDeleteClick();
                  }}
                  className="block w-full rounded-md px-2.5 py-1.5 text-left text-small text-status-error hover:bg-dark-surface-1"
                >
                  Delete note
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NoteEditorHeader;
