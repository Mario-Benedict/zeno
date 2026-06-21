import { Head, router } from '@inertiajs/react';
import React, { useCallback, useLayoutEffect, useEffect, useMemo, useState } from 'react';

import Header from '@/components/layouts/Header';
import Sidebar from '@/components/layouts/Sidebar';
import DeleteConfirmModal from '@/components/notes/DeleteConfirmModal';
import NoteEditorPanel from '@/components/notes/NoteEditorPanel';
import SharedEditorPanel from '@/components/notes/SharedEditorPanel';
import NoteListPanel from '@/components/notes/NoteListPanel';
import type { NoteItem, PersonalNotesProps } from '@/components/notes/types';

interface LaravelEcho {
    join: (channelName: string) => any;
    leave: (channelName: string) => void;
    socketId: () => string;
}

declare global {
    interface Window {
        Echo?: LaravelEcho;
    }
}

interface NotesWorkspaceProps extends PersonalNotesProps {
    type: 'personal' | 'shared';
}

/**
 * NotesWorkspace Component (Seamless Real-time Edition)
 * * Integrates full-width workspaces with robust document cursor safeguards.
 * * Uses X-Socket-ID headers to align with the project's background message queues.
 */
const NotesWorkspace = ({ projectSlug, initialNotes = [], type }: NotesWorkspaceProps): React.ReactElement => {
    const safeInitialNotes = Array.isArray(initialNotes) ? initialNotes : [];

    const [notes, setNotes]               = useState<NoteItem[]>(safeInitialNotes);
    const [searchQuery, setSearchQuery]   = useState('');
    const [selectedNote, setSelectedNote] = useState<NoteItem | null>(safeInitialNotes[0] ?? null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    const filteredNotes = useMemo<NoteItem[]>(
        () => notes.filter((n) => (n?.title || '').toLowerCase().includes((searchQuery || '').toLowerCase())),
        [searchQuery, notes],
    );

    // SATU-SATUNYA EFEK SINKRONISASI: Menggabungkan sinkronisasi list dan selected note 
    // ke macrotask aman (setTimeout) untuk memecah call-stack render sinkron.
    useLayoutEffect(() => {
        const freshNotes = Array.isArray(initialNotes) ? initialNotes : [];

        const timer = setTimeout(() => {
            // 1. Sinkronisasi daftar catatan
            setNotes((prev) => {
                const sameLength = prev.length === freshNotes.length;
                const sameContent = sameLength && prev.every((p, idx) => p.id === freshNotes[idx].id);

                return sameContent ? prev : freshNotes;
            });

            // 2. Sinkronisasi catatan yang sedang aktif dipilih
            setSelectedNote((prev) => {
                if (freshNotes.length === 0) {
                    return prev === null ? prev : null;
                }
                const stillExists = freshNotes.find((n) => n.id === prev?.id);
                if (stillExists) {
                    // Cek perubahan judul dan struktur konten agar tidak asal re-render jika isinya identik
                    if (prev && stillExists.id === prev.id && stillExists.title === prev.title && JSON.stringify(stillExists.content) === JSON.stringify(prev.content)) {
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

    // ── LARAVEL ECHO REAL-TIME LAYER (INTEGRATED WITH MESSAGE QUEUES) ──
    useEffect(() => {
        if (type !== 'shared' || !selectedNote?.id) return;

        const channel = window.Echo?.join(`note.${selectedNote.id}`);

        if (channel) {
            channel.listen('.note.updated', (e: { id: string; title: string; content: { html: string; text: string } }) => {
                // Perbarui list di sidebar kiri
                setNotes((prevNotes) =>
                    prevNotes.map((n) => (n.id === e.id ? { ...n, title: e.title, content: e.content } : n))
                );

                // Sinkronisasi area konten dokumen
                if (selectedNote?.id === e.id) {
                    setSelectedNote((current) => current ? { ...current, title: e.title, content: e.content } : null);
                    
                    const editorElement = document.querySelector('[contenteditable="true"]');
                    
                    // FIX PINTAR: Update isi HANYA JIKA browser kita sedang tidak fokus mengetik di sana
                    // Ini menghentikan masalah kursor melompat balik ke baris awal/atas!
                    if (editorElement && document.activeElement !== editorElement) {
                        editorElement.innerHTML = e.content.html;
                    }
                }
            });
        }

        return () => {
            window.Echo?.leave(`note.${selectedNote.id}`);
        };
    }, [selectedNote?.id, type]);

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
                title: isSharedMode ? 'Untitled Shared Page' : 'Untitled', 
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

    // ── PATCH / SAVE ──
    const handleSave = useCallback((id: string, title: string, html: string) => {
        // Mengambil kode socket ID aktif dari instance internal Laravel Echo kelompokmu
        const socketId = window.Echo?.socketId() ?? '';

        router.patch(
            `/p/${projectSlug}/notes/${id}`,
            { title, content: { html, text: html } },
            {
                preserveScroll: true,
                preserveState: true,
                headers: { 'X-Socket-ID': socketId }, // Menghubungkan antrean pipa data backend
                onSuccess: (page) => {
                    const fresh = (page.props as unknown as NotesWorkspaceProps).initialNotes;
                    const safeFresh = Array.isArray(fresh) ? fresh : [];
                    setNotes(safeFresh);
                    setSelectedNote((prev) => safeFresh.find((n) => n.id === prev?.id) ?? null);
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

            <div className="flex flex-1 min-h-0 overflow-hidden">
                <Sidebar projectSlug={projectSlug} />

                <div className="m-2 flex flex-1 gap-2 overflow-hidden rounded-xl border-2 border-dark-surface-3 p-2">
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

                    {/* Pengondisian Editor Dinamis Berdasarkan Tipe Workspace */}
                    {type === 'shared' ? (
                        <SharedEditorPanel
                            projectSlug={projectSlug}
                            selectedNote={selectedNote}
                            onSave={handleSave}
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