import React from 'react';
import { useRelativeTime } from '@/hooks/useRelativeTime';
import type { NoteListItem as NoteListItemType } from '@/types/notes';

interface NoteListItemProps {
  note: NoteListItemType;
  isActive: boolean;
  onSelect: (note: NoteListItemType) => void;
  onDeleteRequest: (id: string) => void;
}

const NoteListItem = ({
  note,
  isActive,
  onSelect,
  onDeleteRequest,
}: NoteListItemProps): React.ReactElement => {
  const relativeTime = useRelativeTime(note.updatedAt);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(note)}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(note)}
      className={`group relative flex w-full shrink-0 flex-col justify-center gap-0.5 rounded-md border px-2.5 py-1.5 text-left transition-colors duration-150 ${
        isActive
          ? 'border-dark-surface-1 bg-dark-surface-1'
          : 'border-dark-surface-3 bg-dark-surface-3 hover:border-dark-surface-1 hover:bg-dark-surface-1'
      }`}
    >
      <p className="m-0 truncate pr-6 text-small font-semibold text-dark-primary">
        {note.title || 'Untitled'}
      </p>

      {relativeTime && (
        <span className="pr-6 text-xsmall text-dark-secondary">
          {relativeTime}
        </span>
      )}

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDeleteRequest(note.id);
        }}
        title="Delete note"
        className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-dark-secondary opacity-0 transition-opacity group-hover:opacity-100 hover:text-dark-primary"
      >
        <svg
          width="13"
          height="13"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6" />
          <path d="M14 11v6" />
        </svg>
      </button>
    </div>
  );
};

export default NoteListItem;
