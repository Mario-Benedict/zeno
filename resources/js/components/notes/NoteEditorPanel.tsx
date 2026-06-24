import React, { useCallback, useEffect, useRef, useState } from 'react';
import NoteEmptyState from './NoteEmptyState';
import NoteTabSwitcher from './NoteTabSwitcher';
import NoteToolbar from './NoteToolbar';
import type { NoteItem } from './types';

interface NoteEditorPanelProps {
    projectSlug: string;
    selectedNote: NoteItem | null;
    onSave: (id: string, title: string, html: string) => void;
}

/**
 * NoteEditorPanel Component (Dynamic Full-Width Workspace)
 * 100% Patuh pada Token Design System Kelompok (Tanpa Piksel Manual).
 */
const NoteEditorPanel = ({ projectSlug, selectedNote, onSave }: NoteEditorPanelProps): React.ReactElement => {
    const note = selectedNote;
    const [title, setTitle] = useState(note?.title === 'Untitled' || note?.title === 'Untitled Shared Page' ? '' : (note?.title ?? ''));
    const editorRef = useRef<HTMLDivElement>(null);
    const savedHtmlRef = useRef<string>('');
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const isSharedTab = window.location.pathname.includes('/notes/shared');

    const latestTitleRef = useRef(title);
    useEffect(() => {
        latestTitleRef.current = title;
    }, [title]);

    const [prevNoteId, setPrevNoteId] = useState(note?.id);
    if (note?.id !== prevNoteId) {
        setPrevNoteId(note?.id);
        if (!note) {
            setTitle('');
        } else {
            setTitle(note.title === 'Untitled' || note.title === 'Untitled Shared Page' ? '' : note.title);
        }
    }

    const triggerSave = useCallback(() => {
        if (!note) return;
        const defaultTitle = isSharedTab ? 'Untitled Shared Page' : 'Untitled';
        const currentTitle = latestTitleRef.current.trim() || defaultTitle;
        const currentHtml = editorRef.current?.innerHTML ?? '';
        
        if (currentTitle !== note.title || currentHtml !== savedHtmlRef.current) {
            savedHtmlRef.current = currentHtml;
            onSave(note.id, currentTitle, currentHtml);
        }
    }, [note, onSave, isSharedTab]);

    const triggerDebounceSave = useCallback(() => {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => {
            triggerSave();
        }, 500);
    }, [triggerSave]);

    const handleContentChange = useCallback(() => {
        triggerDebounceSave();
    }, [triggerDebounceSave]);

    useEffect(() => {
        const currentEditor = editorRef.current;

        return () => {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
            if (!note) { 
                savedHtmlRef.current = '';
                if (currentEditor) currentEditor.innerHTML = '';
                return;
            }
            
            const defaultTitle = isSharedTab ? 'Untitled Shared Page' : 'Untitled';
            const currentTitle = latestTitleRef.current.trim() || defaultTitle;
            const currentHtml = currentEditor?.innerHTML ?? '';
            
            if (currentTitle !== note.title || currentHtml !== savedHtmlRef.current) {
                onSave(note.id, currentTitle, currentHtml);
            }
        };
    }, [note, onSave, isSharedTab]);

    useEffect(() => {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        
        if (!note) {
            savedHtmlRef.current = '';
            if (editorRef.current) editorRef.current.innerHTML = '';
            return;
        }

        const initialHtml = note.content?.html ?? note.content?.text ?? '';
        savedHtmlRef.current = initialHtml;
        
        if (editorRef.current) {
            editorRef.current.innerHTML = initialHtml;
        }
    }, [note]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        const editor = editorRef.current;
        if (!editor) return;

        if (e.key === ' ') {
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const container = range.startContainer;
                const textContent = container.textContent ?? '';
                
                if (textContent.trim() === '-') {
                    e.preventDefault();
                    document.execCommand('delete', false);
                    document.execCommand('insertUnorderedList', false);
                    handleContentChange();
                    return;
                }
            }
        }

        if (e.key === 'Backspace') {
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const startNode = range.startContainer;
                
                let currentBlock = startNode.nodeType === Node.ELEMENT_NODE 
                    ? (startNode as Element) 
                    : startNode.parentElement;

                while (currentBlock && currentBlock.parentElement !== editor && currentBlock.tagName !== 'LI') {
                    currentBlock = currentBlock.parentElement;
                }

                if (currentBlock && currentBlock.tagName === 'LI' && range.startOffset === 0) {
                    const hasText = currentBlock.textContent && currentBlock.textContent.length > 0;
                    if (!hasText) {
                        e.preventDefault();
                        document.execCommand('insertUnorderedList', false);
                        handleContentChange();
                        return;
                    }
                }
            }
            handleContentChange();
        }
    };

    return (
        <div className="flex flex-col flex-1 h-full bg-dark-surface-2 p-4 box-border font-sans min-h-0 rounded-lg">
            <div className="flex justify-start mb-4">
                <NoteTabSwitcher projectSlug={projectSlug} activeTab={isSharedTab ? "shared" : "personal"} />
            </div>
            
            <div className="flex flex-col flex-1 w-full bg-dark-surface-3 p-6 box-border rounded-lg overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden min-h-0">
                {!note ? (
                    <div className="flex flex-1 items-center justify-center w-full h-full">
                        <NoteEmptyState type={isSharedTab ? "shared" : "personal"} />
                    </div>
                ) : (
                    <>
                        <input
                            value={title}
                            onChange={(e) => {
                                setTitle(e.target.value); handleContentChange(); 
                            }}
                            onBlur={triggerSave}
                            placeholder="New page"
                            className="w-full bg-transparent border-none outline-none font-bold text-h1 mb-4 p-0 box-border placeholder:text-dark-secondary/40 text-dark-primary font-sans"
                        />

                        <NoteToolbar editorRef={editorRef} onContentChange={handleContentChange} />

                        <div
                            ref={editorRef}
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={triggerSave}
                            onInput={handleContentChange}
                            onKeyDown={handleKeyDown}
                            data-placeholder="Start writing..."
                            className="
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
                            "
                        />
                    </>
                )}
            </div>
        </div>
    );
};

export default NoteEditorPanel;