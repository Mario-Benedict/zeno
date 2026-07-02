import { EditorContent } from '@tiptap/react';
import React, { useCallback } from 'react';
import type { NoteDetail } from '@/types/notes';
import NoteEditorHeader from './NoteEditorHeader';
import NoteEmptyState from './NoteEmptyState';
import { useNoteEditor } from './useNoteEditor';
import { useNoteRealtime } from './useNoteRealtime';

interface NoteEditorProps {
  projectSlug: string;
  note: NoteDetail | null;
  canEdit: boolean;
  currentUserId: number;
  onSaved: (note: NoteDetail) => void;
  onShareClick: () => void;
  onDeleteClick: () => void;
}

/**
 * The right-hand editor panel — Tiptap instance, autosave status, presence,
 * and the "changed elsewhere" guard all live here, wired up via
 * useNoteEditor/useNoteRealtime.
 */
const NoteEditor = ({
  projectSlug,
  note,
  canEdit,
  currentUserId,
  onSaved,
  onShareClick,
  onDeleteClick,
}: NoteEditorProps): React.ReactElement => {
  const { editor, title, setTitle, saveStatus, savedAt, isDirty, applyRemoteContent, flushSave } = useNoteEditor({
    projectSlug,
    note,
    canEdit,
    onSaved,
  });

  const handleRemoteUpdate = useCallback(
    (remoteNote: NoteDetail) => {
      applyRemoteContent(remoteNote);
      onSaved(remoteNote);
    },
    [applyRemoteContent, onSaved],
  );

  const { onlineUsers, hasStaleRemoteChange, dismissStaleRemoteChange } = useNoteRealtime({
    noteId: note?.id ?? null,
    isShared: note?.isShared ?? false,
    isDirty,
    onRemoteUpdate: handleRemoteUpdate,
  });

  if (!note) {
    return (
      <div className="flex min-h-0 flex-1 flex-col rounded-lg bg-dark-surface-2 p-4">
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto rounded-lg bg-dark-surface-3 p-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <NoteEmptyState />
        </div>
      </div>
    );
  }

  const isOwner = note.ownerId === currentUserId;

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-lg bg-dark-surface-2 p-4">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto rounded-lg bg-dark-surface-3 p-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <NoteEditorHeader
          note={note}
          title={title}
          onTitleChange={setTitle}
          onTitleBlur={flushSave}
          canEdit={canEdit}
          isOwner={isOwner}
          saveStatus={saveStatus}
          savedAt={savedAt}
          onlineUserIds={onlineUsers.map((u) => u.id)}
          onShareClick={onShareClick}
          onDeleteClick={onDeleteClick}
        />

        {!canEdit && (
          <div className="mb-3 rounded-lg border border-dark-border/40 bg-dark-surface-2 px-3 py-2 text-small font-medium text-dark-secondary">
            You have view-only access to this note.
          </div>
        )}

        {hasStaleRemoteChange && (
          <button
            type="button"
            onClick={dismissStaleRemoteChange}
            className="mb-3 rounded-lg border border-status-warning/40 bg-dark-surface-2 px-3 py-2 text-left text-small font-medium text-status-warning"
          >
            This note changed elsewhere while you were editing. Your changes are safe — dismiss to keep working.
          </button>
        )}

        <EditorContent editor={editor} className="prose-note flex-1" />
      </div>
    </div>
  );
};

export default NoteEditor;
