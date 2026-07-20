import React from 'react';
import type { NoteListItem as NoteListItemType } from '@/types/notes';
import NoteListItem from './NoteListItem';

interface NotesSectionProps {
  label: string;
  notes: NoteListItemType[];
  selectedNoteId: string | null;
  currentUserId: number;
  onSelectNote: (note: NoteListItemType) => void;
  onDeleteRequest: (id: string) => void;
}

const NotesSection = ({
  label,
  notes,
  selectedNoteId,
  currentUserId,
  onSelectNote,
  onDeleteRequest,
}: NotesSectionProps): React.ReactElement | null => {
  if (notes.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5">
      <span className="block px-0.5 text-xsmall font-bold tracking-wide text-dark-primary/60 uppercase">
        {label}
      </span>
      <div className="flex flex-col gap-1">
        {notes.map((note) => (
          <NoteListItem
            key={note.id}
            note={note}
            isActive={selectedNoteId === note.id}
            canDelete={note.ownerId === currentUserId}
            onSelect={onSelectNote}
            onDeleteRequest={onDeleteRequest}
          />
        ))}
      </div>
    </div>
  );
};

export default NotesSection;
