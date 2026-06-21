import React from 'react';
import NoteEmptyState from './NoteEmptyState';
import NoteTabSwitcher from './NoteTabSwitcher';
import NoteToolbar from './NoteToolbar';
import type { NoteItem } from './types';
import { useNoteEditor } from './useNoteEditor';

interface SharedEditorPanelProps {
    projectSlug: string;
    selectedNote: NoteItem | null;
    onSave: (id: string, title: string, html: string) => void;
}

/**
 * SharedEditorPanel Component
 * * Coordinates input events from the rich editable text container, 
 * * applying structured typography and debounced mutation patches to backend endpoints.
 */
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
            
            <div className="flex flex-1 gap-4 w-full min-h-0 items-start">
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
 setTitle(e.target.value); triggerDebounceSave(); 
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
                                className="
                                    flex-1 mt-6 outline-none text-dark-primary break-words font-sans text-[16px] leading-[22.4px] min-h-[450px]
                                    [&_h1]:block [&_h1]:!text-[56px] [&_h1]:!leading-[61.6px] [&_h1]:!font-bold [&_h1]:mt-4 [&_h1]:mb-2
                                    [&_h2]:block [&_h2]:!text-[48px] [&_h2]:!leading-[52.8px] [&_h2]:!font-bold [&_h2]:mt-4 [&_h2]:mb-2
                                    [&_h3]:block [&_h3]:!text-[40px] [&_h3]:!leading-[44px] [&_h3]:!font-bold [&_h3]:mt-3 [&_h3]:mb-1.5
                                    [&_h4]:block [&_h4]:!text-[32px] [&_h4]:!leading-[35.2px] [&_h4]:!font-bold [&_h4]:mt-3 [&_h4]:mb-1.5
                                    [&_h5]:block [&_h5]:!text-[24px] [&_h5]:!leading-[26.4px] [&_h5]:!font-bold [&_h5]:mt-2 [&_h5]:mb-1
                                    [&_h6]:block [&_h6]:!text-[20px] [&_h6]:!leading-[22px] [&_h6]:!font-bold [&_h6]:mt-2 [&_h6]:mb-1
                                    [&_p]:block [&_p]:text-[16px] [&_p]:leading-[22.4px] [&_p]:!m-0 [&_p]:!py-0.5
                                    [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-1
                                    [&_li]:text-[16px] [&_li]:leading-[22.4px] [&_li]:my-0.5
                                    empty:before:content-[attr(data-placeholder)] empty:before:text-dark-secondary/40 empty:before:pointer-events-none
                                "
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SharedEditorPanel;