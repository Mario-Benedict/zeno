import React, { useMemo, useState } from 'react';
import type { NoteListItem as NoteListItemType } from '@/types/notes';
import NoteListItem from './NoteListItem';

interface NotesSidebarPanelProps {
  notes: NoteListItemType[];
  selectedNoteId: string | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectNote: (note: NoteListItemType) => void;
  onCreateNote: (isShared: boolean) => void;
  onDeleteRequest: (id: string) => void;
}

const Section = ({
  label,
  notes,
  selectedNoteId,
  onSelectNote,
  onDeleteRequest,
}: {
  label: string;
  notes: NoteListItemType[];
  selectedNoteId: string | null;
  onSelectNote: (note: NoteListItemType) => void;
  onDeleteRequest: (id: string) => void;
}): React.ReactElement | null => {
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
            onSelect={onSelectNote}
            onDeleteRequest={onDeleteRequest}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * Single sectioned sidebar (Private / Shared) — no more route-per-tab
 * switching. Selecting a note is purely client-side; the parent lazily
 * fetches its full content.
 */
const NotesSidebarPanel = ({
  notes,
  selectedNoteId,
  searchQuery,
  onSearchChange,
  onSelectNote,
  onCreateNote,
  onDeleteRequest,
}: NotesSidebarPanelProps): React.ReactElement => {
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return notes;

    return notes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        (n.excerpt ?? '').toLowerCase().includes(q),
    );
  }, [notes, searchQuery]);

  const privateNotes = filtered.filter((n) => !n.isShared);
  const sharedNotes = filtered.filter((n) => n.isShared);

  return (
    <section className="flex min-h-0 w-[401px] shrink-0 flex-col overflow-hidden rounded-lg border border-dark-border/10 bg-dark-surface-2">
      <div className="px-4 pt-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="m-0 text-h4 font-bold text-dark-primary">Notes</h2>

          <div className="relative">
            <button
              onClick={() => setIsCreateMenuOpen((v) => !v)}
              title="New note"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-none bg-dark-surface-3 text-dark-secondary transition-colors duration-150 hover:bg-dark-surface-1 hover:text-dark-primary"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>

            {isCreateMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsCreateMenuOpen(false)}
                />
                <div className="absolute top-full right-0 z-20 mt-1 w-44 rounded-lg border border-dark-border bg-dark-surface-3 p-1 shadow-lg">
                  <button
                    onClick={() => {
                      onCreateNote(false);
                      setIsCreateMenuOpen(false);
                    }}
                    className="block w-full rounded-md px-2.5 py-1.5 text-left text-small text-dark-primary hover:bg-dark-surface-1"
                  >
                    New private note
                  </button>
                  <button
                    onClick={() => {
                      onCreateNote(true);
                      setIsCreateMenuOpen(false);
                    }}
                    className="block w-full rounded-md px-2.5 py-1.5 text-left text-small text-dark-primary hover:bg-dark-surface-1"
                  >
                    New shared note
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mb-4 flex h-9 items-center rounded-lg border border-dark-border/40 bg-dark-surface-3">
          <input
            type="text"
            placeholder="Search notes…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-full flex-1 border-none bg-transparent pl-3 text-small font-medium text-dark-secondary outline-none placeholder:text-dark-secondary/40"
          />
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-3 shrink-0 text-dark-secondary"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
      </div>

      <div className="scrollbar-app flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
        {filtered.length === 0 ? (
          <p className="mt-4 text-center text-small text-dark-secondary">
            No notes found.
          </p>
        ) : (
          <>
            <Section
              label="Private"
              notes={privateNotes}
              selectedNoteId={selectedNoteId}
              onSelectNote={onSelectNote}
              onDeleteRequest={onDeleteRequest}
            />
            <Section
              label="Shared"
              notes={sharedNotes}
              selectedNoteId={selectedNoteId}
              onSelectNote={onSelectNote}
              onDeleteRequest={onDeleteRequest}
            />
          </>
        )}
      </div>
    </section>
  );
};

export default NotesSidebarPanel;
