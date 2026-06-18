    import { Head, router } from '@inertiajs/react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import Header from '@/components/layouts/Header';
import Sidebar from '@/components/layouts/Sidebar';
import { NoteItem, PersonalNotesProps } from '@/components/notes/types';
import DeleteConfirmModal from '@/components/notes/DeleteConfirmModal';
import NoteEditorPanel from '@/components/notes/NoteEditorPanel';
import NoteListPanel from '@/components/notes/NoteListPanel';

const PersonalNotes = ({ projectSlug, initialNotes = [] }: PersonalNotesProps): React.ReactElement => {
    const [notes, setNotes]               = useState<NoteItem[]>(initialNotes);
    const [searchQuery, setSearchQuery]   = useState('');
    const [selectedNote, setSelectedNote] = useState<NoteItem | null>(initialNotes[0] ?? null);
    const [isCreating, setIsCreating]     = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    const filteredNotes = useMemo<NoteItem[]>(
        () => notes.filter((n) => n.title.toLowerCase().includes(searchQuery.toLowerCase())),
        [searchQuery, notes],
    );

    // Keep selection in sync when filter removes the active note
    useEffect(() => {
        if (filteredNotes.length === 0) { setSelectedNote(null); return; }
        if (!filteredNotes.some((n) => n.id === selectedNote?.id))
            setSelectedNote(filteredNotes[0]);
    }, [filteredNotes, selectedNote]);

    const handleCreate = useCallback(() => {
        if (isCreating) return;
        setIsCreating(true);
        router.post(
            `/p/${projectSlug}/notes`,
            { title: 'Untitled', content: { html: '', text: '' }, is_shared: false },
            {
                preserveScroll: true,
                onSuccess: (page) => {
                    const fresh = (page.props as unknown as PersonalNotesProps).initialNotes;
                    setNotes(fresh);
                    setSelectedNote(fresh[0] ?? null);
                },
                onFinish: () => setIsCreating(false),
            },
        );
    }, [projectSlug, isCreating]);

    const handleSave = useCallback((id: string, title: string, html: string) => {
        router.patch(
            `/p/${projectSlug}/notes/${id}`,
            { title, content: { html, text: html } },
            {
                preserveScroll: true,
                onSuccess: (page) => {
                    const fresh = (page.props as unknown as PersonalNotesProps).initialNotes;
                    setNotes(fresh);
                    setSelectedNote((prev) => fresh.find((n) => n.id === prev?.id) ?? null);
                },
            },
        );
    }, [projectSlug]);

    const handleDelete = useCallback((id: string) => {
        router.delete(`/p/${projectSlug}/notes/${id}`, {
            preserveScroll: true,
            onSuccess: (page) => {
                const fresh = (page.props as unknown as PersonalNotesProps).initialNotes;
                setNotes(fresh);
                setSelectedNote(fresh[0] ?? null);
                setDeleteConfirmId(null);
            },
        });
    }, [projectSlug]);

    return (
        <div className="flex flex-col h-dvh overflow-hidden bg-dark-surface-1 font-sans">
            <Head title="Personal Notes" />
            <Header projectName="Project Zeno" />

            <div className="flex flex-1 min-h-0 overflow-hidden">
                <Sidebar projectSlug={projectSlug} />

                <div className="m-2 flex flex-1 gap-2 overflow-hidden rounded-xl border-2 border-dark-surface-3 p-2">
                    <NoteListPanel
                        notes={filteredNotes}
                        selectedNote={selectedNote}
                        searchQuery={searchQuery}
                        isCreating={isCreating}
                        onSearchChange={setSearchQuery}
                        onSelectNote={setSelectedNote}
                        onCreateNote={handleCreate}
                        onDeleteRequest={setDeleteConfirmId}
                    />

                    <NoteEditorPanel
                        projectSlug={projectSlug}
                        selectedNote={selectedNote}
                        onSave={handleSave}
                    />
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

export default PersonalNotes;