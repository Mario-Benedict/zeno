import React from 'react';
import { useRelativeTime } from '@/hooks/useRelativeTime';
import { useTranslation } from '@/hooks/useTranslation';
import type { NoteListItem as NoteListItemType } from '@/types/notes';
import TrashIcon from '@public/icons/small/trash.svg';

interface NoteListItemProps {
  note: NoteListItemType;
  isActive: boolean;
  canDelete: boolean;
  onSelect: (note: NoteListItemType) => void;
  onDeleteRequest: (id: string) => void;
}

const NoteListItem = ({
  note,
  isActive,
  canDelete,
  onSelect,
  onDeleteRequest,
}: NoteListItemProps): React.ReactElement => {
  const { t } = useTranslation();
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
        {note.title || t('notes.untitled')}
      </p>

      {relativeTime && (
        <span className="pr-6 text-xsmall text-dark-secondary">
          {relativeTime}
        </span>
      )}

      {canDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteRequest(note.id);
          }}
          title={t('notes.deleteNote')}
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-dark-secondary opacity-0 transition-opacity group-hover:opacity-100 hover:text-dark-primary"
        >
          <TrashIcon className="h-[13px] w-[13px]" />
        </button>
      )}
    </div>
  );
};

export default NoteListItem;
