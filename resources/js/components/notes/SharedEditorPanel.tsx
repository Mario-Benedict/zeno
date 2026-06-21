import React from 'react';
import NoteEmptyState from './NoteEmptyState';
import NoteTabSwitcher from './NoteTabSwitcher';
import NoteToolbar from './NoteToolbar';
import CollaboratorsPanel from './CollaboratorsPanel';
import type { NoteItem } from './types';
import { useNoteEditor } from './useNoteEditor';

interface SharedEditorPanelProps {
    projectSlug: string;
    selectedNote: NoteItem | null;
    onSave: (id: string, title: string, html: string) => void;
}

const SharedEditorPanel = ({ 
    projectSlug, 
    selectedNote, 
    onSave 
}: SharedEditorPanelProps): React.ReactElement => {
    const { title, setTitle, editorRef, triggerSave, triggerDebounceSave } = useNoteEditor({
        note: selectedNote,
        onSave,
        defaultTitle: 'Untitled Shared Page'
    });

    return (
        <div className="flex flex-col flex-1 h-full bg-dark-surface-2 p-4 box-border font-sans min-h-0 rounded-lg">
            <div className="flex justify-start mb-4">
                <NoteTabSwitcher projectSlug={projectSlug} activeTab="shared" />
            </div>
            
            <div className="flex flex-1 gap-4 w-full min-h-0 items-stretch">
                {/* Kolom Kiri: Canvas Editor */}
                <div className="flex flex-col flex-1 h-full bg-dark-surface-3 p-6 box-border rounded-lg overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    {!selectedNote ? (
                        <div className="flex flex-1 items-center justify-center w-full h-full">
                            <NoteEmptyState type="shared" />
                        </div>
                    ) : (
                        <>
                            <input
                                value={title}
                                onChange={(e) => {
                                    setTitle(e.target.value); 
                                    triggerDebounceSave(); 
                                }}
                                onBlur={triggerSave}
                                placeholder="New page"
                                className="w-full bg-transparent border-none outline-none font-bold text-[40px] leading-[44px] mb-4 p-0 box-border placeholder:text-dark-secondary text-dark-primary"
                            />
                            
                            <NoteToolbar editorRef={editorRef} onContentChange={triggerDebounceSave} />
                            
                            <div
                                ref={editorRef}
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={triggerSave}
                                onInput={triggerDebounceSave}
                                data-placeholder="Start writing..."
                                className="flex-1 mt-6 outline-none text-dark-primary break-words font-sans text-[16px] leading-[22.4px] min-h-[450px] empty:before:content-[attr(data-placeholder)] empty:before:text-dark-secondary/40 empty:before:pointer-events-none"
                            />
                        </>
                    )}
                </div>

                {/* Kolom Kanan: Panel Kolaborator */}
                {selectedNote && (
                    <CollaboratorsPanel 
                        collaborators={selectedNote.collaborators ?? []} 
                        activeOnlineUsers={[]} 
                    />
                )}
            </div>
        </div>
    );
};

export default SharedEditorPanel;