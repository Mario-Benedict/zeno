import { Head, router } from '@inertiajs/react';
import React, { useCallback, useLayoutEffect, useEffect, useMemo, useState } from 'react';

import echo from '@/echo';
import Header from '@/components/layouts/Header';
import Sidebar from '@/components/layouts/Sidebar';
import DeleteConfirmModal from '@/components/notes/DeleteConfirmModal';
import NoteEditorPanel from '@/components/notes/NoteEditorPanel';
import SharedEditorPanel from '@/components/notes/SharedEditorPanel';
import NoteListPanel from '@/components/notes/NoteListPanel';
import type { NoteItem, PersonalNotesProps } from '@/components/notes/types';

interface NotesWorkspaceProps extends PersonalNotesProps {
    type: 'personal' | 'shared';
}

const NotesWorkspace = ({ projectSlug, initialNotes = [], type, currentUserId }: NotesWorkspaceProps): React.ReactElement => {
    const safeInitialNotes = Array.isArray(initialNotes) ? initialNotes : [];

    const [notes, setNotes]               = useState<NoteItem[]>(safeInitialNotes);
    const [searchQuery, setSearchQuery]   = useState('');
    const [selectedNote, setSelectedNote] = useState<NoteItem | null>(safeInitialNotes[0] ?? null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    const filteredNotes = useMemo<NoteItem[]>(
        () => notes.filter((n) => (n?.title || '').toLowerCase().includes((searchQuery || '').toLowerCase())),
        [searchQuery, notes],
    );

    // Derive canEdit: owner selalu bisa edit, collaborator cek pivot can_edit (role === 'Editor')
    const canEdit = useMemo(() => {
        if (!selectedNote) return false;
        if (selectedNote.ownerId === currentUserId) return true;
        const collab = selectedNote.collaborators?.find((c) => c.id === currentUserId);
        return collab?.role === 'Editor';
    }, [selectedNote, currentUserId]);

    useLayoutEffect(() => {
        const freshNotes = Array.isArray(initialNotes) ? initialNotes : [];

        const timer = setTimeout(() => {
            setNotes((prev) => {
                const sameLength = prev.length === freshNotes.length;
                const sameContent = sameLength && prev.every((p, idx) => p.id === freshNotes[idx].id);
                return sameContent ? prev : freshNotes;
            });

            setSelectedNote((prev) => {
                if (freshNotes.length === 0) return null;
                const stillExists = freshNotes.find((n) => n.id === prev?.id);
                if (stillExists) {
                    if (
                        prev &&
                        stillExists.id === prev.id &&
                        stillExists.title === prev.title &&
                        JSON.stringify(stillExists.content) === JSON.stringify(prev.content)
                    ) {
                        return prev;
                    }
                    return stillExists;
                }
                return freshNotes[0];
            });
        }, 0);

        return () => clearTimeout(timer);
    }, [initialNotes]);

    const handleSelectNote = useCallback((note: NoteItem) => {
        setSelectedNote(note);
        if (type === 'shared') {
            router.get(
                `/p/${projectSlug}/notes/shared`,
                { noteId: note.id },
                { preserveState: true, preserveScroll: true }
            );
        }
    }, [projectSlug, type]);

    const handleRemoteUpdate = useCallback((id: string, title: string, content: { html: string; text: string }) => {
        // Hanya update notes list, TIDAK setSelectedNote — mencegah cursor jump
        setNotes((prev) => prev.map((n) => n.id === id ? { ...n, title, content } : n));
    }, []);

    const handleCreate = useCallback(() => {
        const isSharedMode = type === 'shared';

        if (!isSharedMode) {
            const temporaryId = `temp-${Date.now()}`;
            const optimisticNote: NoteItem = {
                id: temporaryId,
                title: 'Untitled',
                content: { html: '', text: '' },
                is_shared: false
            };
            setNotes((prev) => [optimisticNote, ...prev]);
            setSelectedNote(optimisticNote);
        }

        router.post(
            `/p/${projectSlug}/notes`,
            {
                title: isSharedMode ? 'Untitled' : 'Untitled',
                content: { html: '', text: '' },
                is_shared: isSharedMode
            },
            {
                preserveScroll: true,
                onSuccess: (page) => {
                    const fresh = (page.props as unknown as NotesWorkspaceProps).initialNotes;
                    const safeFresh = Array.isArray(fresh) ? fresh : [];
                    setNotes(safeFresh);
                    if (safeFresh.length > 0) {
                        setSelectedNote(safeFresh[0]);
                    }
                },
            },
        );
    }, [projectSlug, type]);

    const handleSave = useCallback((id: string, title: string, html: string) => {
        const socketId = echo?.socketId() ?? null;

        router.patch(
            `/p/${projectSlug}/notes/${id}`,
            { title, content: { html, text: html } },
            {
                preserveScroll: true,
                preserveState: true,
                headers: socketId ? { 'X-Socket-ID': socketId } : {},
                onSuccess: (page) => {
                    const fresh = (page.props as unknown as NotesWorkspaceProps).initialNotes;
                    if (fresh) {
                        const safeFresh = Array.isArray(fresh) ? fresh : [];
                        setNotes(safeFresh);
                        setSelectedNote((prev) => safeFresh.find((n) => n.id === prev?.id) ?? null);
                    }
                },
            },
        );
    }, [projectSlug]);

    const handleDelete = useCallback((id: string) => {
        setNotes((prev) => {
            const updated = prev.filter((n) => n.id !== id);
            if (selectedNote?.id === id) {
                setSelectedNote(updated[0] ?? null);
            }
            return updated;
        });
        setDeleteConfirmId(null);

        router.delete(`/p/${projectSlug}/notes/${id}`, {
            preserveScroll: true,
            onSuccess: (page) => {
                const fresh = (page.props as unknown as NotesWorkspaceProps).initialNotes;
                setNotes(Array.isArray(fresh) ? fresh : []);
            },
        });
    }, [projectSlug, selectedNote]);

    return (
        <div className="flex flex-col h-dvh overflow-hidden bg-dark-surface-1 font-sans">
            <Head title={type === 'shared' ? 'Shared Workspace' : 'Personal Notes'} />
            <Header projectName="Project Zeno" />

            <div className="flex flex-1 min-h-0 overflow-auto">
                <Sidebar projectSlug={projectSlug} />

                <div className="m-2 flex flex-1 gap-2 overflow-auto rounded-xl border-2 border-dark-surface-3 p-2">
                    <NoteListPanel
                        title={type === 'shared' ? 'Shared Notes' : 'Personal Notes'}
                        notes={filteredNotes}
                        selectedNote={selectedNote}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        onSelectNote={handleSelectNote}
                        onCreateNote={handleCreate}
                        onDeleteRequest={setDeleteConfirmId}
                    />
                    {type === 'shared' ? (
                        <SharedEditorPanel
                            projectSlug={projectSlug}
                            selectedNote={selectedNote}
                            currentUserId={currentUserId}
                            canEdit={canEdit}
                            onSave={handleSave}
                            onRemoteUpdate={handleRemoteUpdate}
                        />
                    ) : (
                        <NoteEditorPanel
                            projectSlug={projectSlug}
                            selectedNote={selectedNote}
                            onSave={handleSave}
                        />
                    )}
                </div>
            </div>

            {deleteConfirmId !== null && (
                <DeleteConfirmModal
                    onConfirm={() => handleDelete(deleteConfirmId)}
                    onCancel={() => setDeleteConfirmId(null)}
                />
            )}
        </div>
    );
};

export default NotesWorkspace;