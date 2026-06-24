import React, { useEffect, useRef, useState } from 'react';
import CollaboratorsPanel from './CollaboratorsPanel';
import type { PresenceUser } from './CollaboratorsPanel';
import NoteEmptyState from './NoteEmptyState';
import NoteTabSwitcher from './NoteTabSwitcher';
import NoteToolbar from './NoteToolbar';
import type { NoteItem } from './types';
import { useNoteEditor } from './useNoteEditor';
import echo from '@/echo';

interface SharedEditorPanelProps {
    projectSlug: string;
    selectedNote: NoteItem | null;
    canEdit: boolean;
    currentUserId: number;
    onSave: (id: string, title: string, html: string) => void;
    onRemoteUpdate: (id: string, title: string, content: { html: string; text: string }) => void;
}

const SharedEditorPanel = ({
    projectSlug,
    selectedNote,
    canEdit,
    currentUserId,
    onSave,
    onRemoteUpdate,
}: SharedEditorPanelProps): React.ReactElement => {
    const { title, setTitle, editorRef, triggerSave, triggerDebounceSave } = useNoteEditor({
        note: selectedNote,
        onSave,
        defaultTitle: 'Untitled Shared Page',
        canEdit,
    });

    const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);

    const isOwner = selectedNote?.ownerId === currentUserId;
    const collaborators = selectedNote?.collaborators ?? [];

    const selectedNoteIdRef = useRef<string | null>(selectedNote?.id ?? null);
    useEffect(() => {
        selectedNoteIdRef.current = selectedNote?.id ?? null;
    }, [selectedNote?.id]);

    // ── WEBSOCKET LISTENER + PRESENCE ──
    useEffect(() => {
        if (!selectedNote?.id) return;

        const noteId = selectedNote.id;
        const channel = echo?.join(`note.${noteId}`);
        if (!channel) return;

        // Presence: track siapa yang online
        channel
            .here((users: PresenceUser[]) => setOnlineUsers(users))
            .joining((user: PresenceUser) => setOnlineUsers((prev) => [...prev.filter((u) => u.id !== user.id), user]))
            .leaving((user: PresenceUser) => setOnlineUsers((prev) => prev.filter((u) => u.id !== user.id)));

        channel.listen('.NoteUpdated', (e: any) => {
            const incomingId    = String(e.id ?? e.note?.note_id ?? '');
            const incomingTitle = e.title ?? e.note?.title ?? 'Untitled Shared Page';
            const incomingHtml  = e.content?.html ?? e.note?.content?.html ?? '';
            const incomingContent = {
                html: incomingHtml,
                text: e.content?.text ?? e.note?.content?.text ?? '',
            };

            if (incomingId !== selectedNoteIdRef.current) return;

            onRemoteUpdate(incomingId, incomingTitle, incomingContent);

            if (editorRef.current) {
                const editor = editorRef.current;
                if (editor.innerHTML !== incomingHtml) {
                    const sel = window.getSelection();
                    let savedRange: Range | null = null;
                    if (sel && sel.rangeCount > 0 && editor.contains(sel.anchorNode)) {
                        savedRange = sel.getRangeAt(0).cloneRange();
                    }

                    editor.innerHTML = incomingHtml;

                    if (savedRange && sel) {
                        try {
                            sel.removeAllRanges();
                            sel.addRange(savedRange);
                        } catch {
                            // Range invalid setelah innerHTML diganti — biarkan
                        }
                    }
                }
            }

            setTitle(incomingTitle === 'Untitled Shared Page' ? '' : incomingTitle);
        });

        return () => {
            echo?.leave(`note.${noteId}`);
            setOnlineUsers([]);
        };
    }, [selectedNote?.id]);

    return (
        <div className="flex flex-1 h-full min-h-0 gap-0">
            {/* Editor area */}
            <div className="flex flex-col flex-1 h-full bg-dark-surface-2 p-4 box-border font-sans min-h-0 rounded-lg">
                <div className="flex justify-start mb-4">
                    <NoteTabSwitcher projectSlug={projectSlug} activeTab="shared" />
                </div>

                <div className="flex flex-col flex-1 w-full bg-dark-surface-3 p-6 box-border rounded-lg overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden min-h-0">
                    {!selectedNote ? (
                        <div className="flex flex-1 items-center justify-center w-full h-full">
                            <NoteEmptyState type="shared" />
                        </div>
                    ) : (
                        <>
                            {!canEdit && (
                                <div className="mb-3 px-3 py-2 rounded-lg bg-dark-surface-2 border border-dark-border/40 text-dark-secondary text-small font-medium">
                                    You have view-only access to this note.
                                </div>
                            )}

                            <input
                                value={title}
                                onChange={(e) => {
                                    if (!canEdit) return;
                                    setTitle(e.target.value);
                                    triggerDebounceSave();
                                }}
                                onBlur={canEdit ? triggerSave : undefined}
                                readOnly={!canEdit}
                                placeholder="New page"
                                className={`w-full bg-transparent border-none outline-none font-bold text-h1 mb-4 p-0 box-border placeholder:text-dark-secondary/40 text-dark-primary font-sans ${!canEdit ? 'cursor-default' : ''}`}
                            />

                            {canEdit && (
                                <NoteToolbar editorRef={editorRef} onContentChange={triggerDebounceSave} />
                            )}

                            <div
                                ref={editorRef}
                                contentEditable={canEdit}
                                suppressContentEditableWarning
                                onBlur={canEdit ? triggerSave : undefined}
                                onInput={canEdit ? triggerDebounceSave : undefined}
                                data-placeholder={canEdit ? 'Start writing...' : ''}
                                className={`
                                    flex-1 mt-6 outline-none text-dark-primary break-words font-sans text-medium min-h-[450px]
                                    [&_h1]:block [&_h1]:text-h1 [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2
                                    [&_h2]:block [&_h2]:text-h2 [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2
                                    [&_h3]:block [&_h3]:text-h3 [&_h3]:font-bold [&_h3]:mt-3 [&_h3]:mb-1.5
                                    [&_h4]:block [&_h4]:text-h4 [&_h4]:font-bold [&_h4]:mt-3 [&_h4]:mb-1.5
                                    [&_h5]:block [&_h5]:text-large [&_h5]:font-bold [&_h5]:mt-2 [&_h5]:mb-1
                                    [&_h6]:block [&_h6]:text-medium [&_h6]:font-bold [&_h6]:mt-2 [&_h6]:mb-1
                                    [&_p]:block [&_p]:text-medium [&_p]:!m-0 [&_p]:!py-0.5
                                    [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-1
                                    [&_li]:text-medium [&_li]:my-0.5
                                    empty:before:content-[attr(data-placeholder)] empty:before:text-dark-secondary/40 empty:before:pointer-events-none
                                    [&_.embed-row-block-container]:block [&_.embed-row-block-container]:w-full [&_.embed-row-block-container]:my-3 [&_.embed-row-block-container]:select-none
                                    [&_.embed-card-block]:flex [&_.embed-card-block]:items-center [&_.embed-card-block]:justify-between [&_.embed-card-block]:w-full
                                    [&_.embed-card-block]:bg-dark-surface-2 [&_.embed-card-block]:border [&_.embed-card-block]:border-dark-secondary/10
                                    [&_.embed-card-block]:rounded-xl [&_.embed-card-block]:px-4 [&_.embed-card-block]:py-3 [&_.embed-card-block]:no-underline
                                    [&_.embed-card-block]:text-dark-primary [&_.embed-card-block]:font-bold hover:[&_.embed-card-block]:bg-dark-surface-1
                                    transition-colors duration-150 [&_.embed-card-icon]:w-6 [&_.embed-card-icon]:h-6 [&_.embed-card-icon]:rounded-md
                                    ${!canEdit ? 'cursor-default' : ''}
                                `}
                            />
                        </>
                    )}
                </div>
            </div>

            {/* Collaborators panel — selalu render kalau ada note */}
            {selectedNote && (
                <CollaboratorsPanel
                    noteId={selectedNote.id}
                    projectSlug={projectSlug}
                    collaborators={collaborators}
                    activeOnlineUsers={onlineUsers}
                    isOwner={isOwner}
                />
            )}
        </div>
    );
};

export default SharedEditorPanel;