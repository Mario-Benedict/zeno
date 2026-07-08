import { Head } from '@inertiajs/react';
import axios from 'axios';
import React, { useCallback, useState } from 'react';
import Header from '@/components/layouts/Header';
import Sidebar from '@/components/layouts/Sidebar';
import DeleteNoteDialog from '@/components/notes/DeleteNoteDialog';
import NoteEditor from '@/components/notes/NoteEditor';
import NotesSidebarPanel from '@/components/notes/NotesSidebarPanel';
import ShareNoteDialog from '@/components/notes/ShareNoteDialog';
import { useProject } from '@/hooks/useProject';
import { useTranslation } from '@/hooks/useTranslation';
import notes from '@/routes/notes';
import type { NoteDetail, NoteListItem, NotesPageProps } from '@/types/notes';

/**
 * Single unified notes workspace — Private and Shared notes live in one
 * sidebar with client-side selection (no more `/notes/personal` vs
 * `/notes/shared` route-per-tab). Opening a note lazily fetches its full
 * content; the list itself only ever carries the lightweight preview shape
 * from `NoteController::index`.
 */
const NotesPage = ({
  notes: initialNotes,
  projectUsers,
  currentUserId,
}: NotesPageProps): React.ReactElement => {
  const { t } = useTranslation();
  const { project, accountIndex } = useProject();
  const projectSlug = project.project_slug;

  const [noteList, setNoteList] = useState<NoteListItem[]>(initialNotes);
  const [selectedNote, setSelectedNote] = useState<NoteDetail | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  const isEditable = (note: NoteDetail | null): boolean => {
    if (!note) return false;
    if (note.ownerId === currentUserId) return true;
    return (
      note.collaborators.find((c) => c.id === currentUserId)?.canEdit ?? false
    );
  };

  const upsertListItem = useCallback((note: NoteDetail) => {
    setNoteList((prev) => {
      const item: NoteListItem = {
        id: note.id,
        title: note.title,
        excerpt: note.excerpt,
        isShared: note.isShared,
        ownerId: note.ownerId,
        updatedAt: note.updatedAt,
        collaboratorsCount: note.collaborators.length,
      };

      const next = prev.some((n) => n.id === note.id)
        ? prev.map((n) => (n.id === note.id ? item : n))
        : [item, ...prev];

      return [...next].sort((a, b) =>
        (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''),
      );
    });
  }, []);

  const openNote = useCallback(
    async (item: NoteListItem) => {
      const { data } = await axios.get<{ note: NoteDetail }>(
        notes.show.url({ accountIndex, project: projectSlug, note: item.id }),
      );
      setSelectedNote(data.note);
    },
    [accountIndex, projectSlug],
  );

  const handleSaved = useCallback(
    (note: NoteDetail) => {
      upsertListItem(note);
      setSelectedNote((prev) => (prev?.id === note.id ? note : prev));
    },
    [upsertListItem],
  );

  const handleCreate = useCallback(
    async (isShared: boolean) => {
      const { data } = await axios.post<{ note: NoteDetail }>(
        notes.store.url({ accountIndex, project: projectSlug }),
        {
          title: t('notes.untitled'),
          is_shared: isShared,
        },
      );
      upsertListItem(data.note);
      setSelectedNote(data.note);
    },
    [accountIndex, projectSlug, upsertListItem],
  );

  const handleDelete = useCallback(async () => {
    if (!deleteTargetId) return;

    await axios.delete(
      notes.destroy.url({
        accountIndex,
        project: projectSlug,
        note: deleteTargetId,
      }),
    );
    setNoteList((prev) => prev.filter((n) => n.id !== deleteTargetId));
    setSelectedNote((prev) => (prev?.id === deleteTargetId ? null : prev));
    setDeleteTargetId(null);
  }, [accountIndex, projectSlug, deleteTargetId]);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-dark-surface-1 font-sans">
      <Head title={t('notes.title')} />
      <Header />

      <div className="flex min-h-0 flex-1">
        <Sidebar projectSlug={projectSlug} />

        <div className="m-2 flex min-h-0 flex-1 gap-2 rounded-xl border-2 border-dark-surface-3 p-2">
          <NotesSidebarPanel
            notes={noteList}
            selectedNoteId={selectedNote?.id ?? null}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSelectNote={(item) => void openNote(item)}
            onCreateNote={(isShared) => void handleCreate(isShared)}
            onDeleteRequest={setDeleteTargetId}
          />

          <NoteEditor
            key={selectedNote?.id ?? 'empty'}
            accountIndex={accountIndex}
            projectSlug={projectSlug}
            note={selectedNote}
            canEdit={isEditable(selectedNote)}
            currentUserId={currentUserId}
            onSaved={handleSaved}
            onShareClick={() => setIsShareDialogOpen(true)}
            onDeleteClick={() =>
              selectedNote && setDeleteTargetId(selectedNote.id)
            }
          />
        </div>
      </div>

      {deleteTargetId && (
        <DeleteNoteDialog
          onConfirm={() => void handleDelete()}
          onCancel={() => setDeleteTargetId(null)}
        />
      )}

      {isShareDialogOpen && selectedNote && (
        <ShareNoteDialog
          accountIndex={accountIndex}
          projectSlug={projectSlug}
          note={selectedNote}
          projectUsers={projectUsers}
          onClose={() => setIsShareDialogOpen(false)}
          onNoteUpdated={handleSaved}
        />
      )}
    </div>
  );
};

export default NotesPage;
