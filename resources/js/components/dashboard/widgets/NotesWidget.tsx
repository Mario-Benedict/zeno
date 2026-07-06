import { useEffect, useMemo, useState } from 'react';
import { useProject } from '@/hooks/useProject';
import type { NoteListItem } from '@/types/notes';
import CloseIcon from '@public/icons/small/cancel.svg';
import SearchIcon from '@public/icons/small/search.svg';
import { NotesWidgetDetail } from './NotesWidgetDetail';
import { NotesWidgetList } from './NotesWidgetList';

interface Props {
  notes: NoteListItem[];
  slotIndex: number;
}

const readPersistedNoteId = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const persistNoteId = (key: string, noteId: string | null) => {
  try {
    if (noteId) {
      localStorage.setItem(key, noteId);
    } else {
      localStorage.removeItem(key);
    }
  } catch {
    // localStorage unavailable (private browsing, quota, etc.) — the open
    // note just won't survive navigation, which is a harmless degradation.
  }
};

/**
 * Compact, master-detail notes view for a dashboard slot — not the full
 * notes page. Read-only: shows the note list (with a collapsible search),
 * or the selected note rendered with its real Tiptap styling, never both
 * panes side by side, so a single layout works at any slot size.
 */
export const NotesWidget = ({ notes, slotIndex }: Props) => {
  const { project } = useProject();
  // Scoped per project + slot so switching projects or having more than one
  // notes widget on a dashboard don't stomp on each other's open note.
  const storageKey = `dashboard-notes-widget:${project.project_id}:${slotIndex}`;

  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(() =>
    readPersistedNoteId(storageKey),
  );
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedNote = selectedNoteId
    ? (notes.find((n) => n.id === selectedNoteId) ?? null)
    : null;

  // The persisted id may point at a note that's since been deleted (or that
  // this browser simply can't see anymore) — drop it instead of getting
  // stuck showing nothing.
  useEffect(() => {
    if (selectedNoteId && !selectedNote) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedNoteId(null);
      persistNoteId(storageKey, null);
    }
  }, [selectedNoteId, selectedNote, storageKey]);

  const selectNote = (note: NoteListItem | null) => {
    setSelectedNoteId(note?.id ?? null);
    persistNoteId(storageKey, note?.id ?? null);
  };

  const filteredNotes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return notes;

    return notes.filter(
      (note) =>
        note.title.toLowerCase().includes(query) ||
        (note.excerpt?.toLowerCase().includes(query) ?? false),
    );
  }, [notes, searchQuery]);

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl bg-dark-surface-2">
      {selectedNote ? (
        <NotesWidgetDetail
          key={selectedNote.id}
          note={selectedNote}
          onBack={() => selectNote(null)}
        />
      ) : (
        <>
          <div className="flex shrink-0 items-center gap-2 px-3 pt-3 pb-2">
            {searchOpen ? (
              <>
                <SearchIcon className="h-3.5 w-3.5 shrink-0 text-white/40" />
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search notes…"
                  className="min-w-0 flex-1 bg-transparent text-xsmall text-white placeholder-white/30 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSearchOpen(false);
                    setSearchQuery('');
                  }}
                  aria-label="Close search"
                  className="shrink-0 rounded p-1 text-white/40 transition hover:bg-white/10 hover:text-white"
                >
                  <CloseIcon className="h-3.5 w-3.5" />
                </button>
              </>
            ) : (
              <>
                <span className="flex-1 text-small font-semibold text-dark-primary">
                  Notes
                </span>
                <span className="text-xsmall text-white/30">
                  {notes.length} note{notes.length === 1 ? '' : 's'}
                </span>
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  aria-label="Search notes"
                  className="shrink-0 rounded p-1 text-white/40 transition hover:bg-white/10 hover:text-white"
                >
                  <SearchIcon className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>

          <NotesWidgetList notes={filteredNotes} onSelectNote={selectNote} />
        </>
      )}
    </div>
  );
};
