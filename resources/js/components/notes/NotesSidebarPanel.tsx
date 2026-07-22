import React, { useMemo, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import type { NoteListItem as NoteListItemType } from '@/types/notes';
import PlusIcon from '@public/icons/small/plus.svg';
import SearchIcon from '@public/icons/small/search.svg';
import NotesSection from './NotesSection';

interface NotesSidebarPanelProps {
  notes: NoteListItemType[];
  selectedNoteId: string | null;
  currentUserId: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectNote: (note: NoteListItemType) => void;
  onCreateNote: (isShared: boolean) => void;
  onDeleteRequest: (id: string) => void;
  /** Responsive visibility class controlled by the page (mobile master/detail). */
  className?: string;
}

/**
 * Single sectioned sidebar (Private / Shared) — no more route-per-tab
 * switching. Selecting a note is purely client-side; the parent lazily
 * fetches its full content.
 */
const NotesSidebarPanel = ({
  notes,
  selectedNoteId,
  currentUserId,
  searchQuery,
  onSearchChange,
  onSelectNote,
  onCreateNote,
  onDeleteRequest,
  className = '',
}: NotesSidebarPanelProps): React.ReactElement => {
  const { t } = useTranslation();
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
    <section
      className={`flex min-h-0 w-full shrink-0 flex-col overflow-hidden rounded-lg border border-dark-border/10 bg-dark-surface-2 md:w-[401px] ${className}`}
    >
      <div className="px-4 pt-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="m-0 text-h4 font-bold text-dark-primary">
            {t('notes.title')}
          </h2>

          <div className="relative">
            <button
              onClick={() => setIsCreateMenuOpen((v) => !v)}
              title={t('notes.newNote')}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-none bg-dark-surface-3 text-dark-secondary transition-colors duration-150 hover:bg-dark-surface-1 hover:text-dark-primary"
            >
              <PlusIcon className="h-5 w-5" />
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
                    {t('notes.newPrivateNote')}
                  </button>
                  <button
                    onClick={() => {
                      onCreateNote(true);
                      setIsCreateMenuOpen(false);
                    }}
                    className="block w-full rounded-md px-2.5 py-1.5 text-left text-small text-dark-primary hover:bg-dark-surface-1"
                  >
                    {t('notes.newSharedNote')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mb-4 flex h-9 items-center rounded-lg border border-dark-border/40 bg-dark-surface-3">
          <input
            type="text"
            placeholder={t('notes.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-full flex-1 border-none bg-transparent pl-3 text-small font-medium text-dark-secondary outline-none placeholder:text-dark-secondary/40"
          />
          <SearchIcon className="mr-3 h-4 w-4 shrink-0 text-dark-secondary" />
        </div>
      </div>

      <div className="scrollbar-app flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
        {filtered.length === 0 ? (
          <p className="mt-4 text-center text-small text-dark-secondary">
            {t('notes.noNotesFound')}
          </p>
        ) : (
          <>
            <NotesSection
              label={t('notes.private')}
              notes={privateNotes}
              selectedNoteId={selectedNoteId}
              currentUserId={currentUserId}
              onSelectNote={onSelectNote}
              onDeleteRequest={onDeleteRequest}
            />
            <NotesSection
              label={t('notes.shared')}
              notes={sharedNotes}
              selectedNoteId={selectedNoteId}
              currentUserId={currentUserId}
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
