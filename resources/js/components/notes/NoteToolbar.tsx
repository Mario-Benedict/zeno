import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { AlignCommand, HeadingTag } from './types';
import { execFormatSafe } from './utils';

interface ToolbarButtonProps {
    title: string;
    onClick: () => void;
    isActive?: boolean;
    children: React.ReactNode;
    className?: string;
}

const ToolbarButton = ({ title, onClick, isActive = false, children, className }: ToolbarButtonProps) => (
    <button
        title={title}
        onMouseDown={(e) => {
            e.preventDefault(); 
            onClick(); 
        }}
        className={`
            w-8 h-8 flex items-center justify-center border-none rounded-lg cursor-pointer shrink-0 transition-colors duration-150
            ${isActive ? 'bg-dark-surface-1 text-white' : 'bg-transparent text-dark-secondary hover:bg-dark-surface-3'}
            ${className ?? ''}
        `}
    >
        {children}
    </button>
);

const ToolbarSeparator = () => (
    <div className="w-[2px] h-5 bg-dark-secondary shrink-0 mx-2" />
);

interface NoteToolbarProps {
    editorRef: React.RefObject<HTMLDivElement | null>;
    onContentChange: () => void;
}

const NoteToolbar = ({ editorRef, onContentChange }: NoteToolbarProps): React.ReactElement => {
    const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
    const [headingLabel, setHeadingLabel] = useState<HeadingTag | null>(null);
    const [showHeadingMenu, setShowHeadingMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Pemetaan ukuran piksel heading agar rapi, clean, dan tidak memicu unterminated string
    const headingSizes: Record<HeadingTag, string> = {
        H1: '56px',
        H2: '48px',
        H3: '40px',
        H4: '32px',
        H5: '24px',
        H6: '20px',
    };

    const syncFormats = useCallback(() => {
        if (!editorRef.current) return;
        const formats = new Set<string>();
        if (document.queryCommandState('bold'))               formats.add('bold');
        if (document.queryCommandState('italic'))             formats.add('italic');
        if (document.queryCommandState('underline'))          formats.add('underline');
        if (document.queryCommandState('justifyLeft'))        formats.add('justifyLeft');
        if (document.queryCommandState('justifyCenter'))      formats.add('justifyCenter');
        if (document.queryCommandState('justifyRight'))       formats.add('justifyRight');
        if (document.queryCommandState('justifyFull'))        formats.add('justifyFull');
        if (document.queryCommandState('insertUnorderedList')) formats.add('ul');
        setActiveFormats(formats);

        const rawBlock = document.queryCommandValue('formatBlock');
        const block = rawBlock ? rawBlock.toUpperCase() : '';
        if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(block)) {
            setHeadingLabel(block as HeadingTag);
        } else {
            setHeadingLabel(null);
        }
    }, [editorRef]);

    useEffect(() => {
        document.addEventListener('selectionchange', syncFormats);
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowHeadingMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('selectionchange', syncFormats);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [syncFormats]);

    const handleAlign = (cmd: AlignCommand) => {
        execFormatSafe(editorRef, cmd); 
        syncFormats(); 
        onContentChange(); 
    };

    const handleHeading = (tag: HeadingTag) => {
        const editor = editorRef.current;
        if (!editor) return;
        editor.focus();
        document.execCommand('formatBlock', false, tag.toLowerCase());
        setHeadingLabel(tag);
        setShowHeadingMenu(false);
        setTimeout(syncFormats, 50);
        onContentChange();
    };

    const handleInsertEmbedBlock = () => {
        const editor = editorRef.current;
        if (!editor) return;

        const selectionBefore = window.getSelection();
        let savedRange: Range | null = null;
        
        if (selectionBefore && selectionBefore.rangeCount > 0) {
            savedRange = selectionBefore.getRangeAt(0).cloneRange();
            if (!savedRange.collapsed) {
                savedRange.collapse(false);
            }
        }

        const url = window.prompt('Masukkan URL tautan / sumber daya figma:');
        if (!url) return;

        editor.focus();

        const liveSelection = window.getSelection();
        if (savedRange && liveSelection) {
            liveSelection.removeAllRanges();
            liveSelection.addRange(savedRange);
        }

        const domainName = url.replace(/https?:\/\/(www\.)?/, '').split('/')[0];
        
        let providerLabel = domainName;
        if (url.includes('figma.com')) providerLabel = 'Figma Resource';
        else if (url.includes('youtube.com') || url.includes('youtu.be')) providerLabel = 'YouTube Resource';
        else if (url.includes('gemini.google.com')) providerLabel = 'Gemini Resource';

        // Menggunakan kelas utilitas murni dari tailwind.config.js kelompokmu
        const embedHtmlString = `
            <div class="embed-row-block-container block w-full my-3 select-none" contenteditable="false">
                <a href="${url}" target="_blank" rel="noopener noreferrer" class="embed-card-block flex items-center justify-between gap-3 no-underline">
                    <div class="flex items-center gap-3 overflow-hidden">
                        <img src="https://www.google.com/s2/favicons?domain=${domainName}&sz=32" class="embed-card-icon w-6 h-6 rounded-md shrink-0" alt="" />
                        <span class="font-bold text-white whitespace-nowrap overflow-hidden text-ellipsis">${providerLabel}</span>
                    </div>
                    <span class="text-dark-secondary text-xsmall bg-dark-input px-2 py-1 rounded border border-dark-border shrink-0">Embed Card</span>
                </a>
            </div>
            <p><br></p>
        `;

        document.execCommand('insertHTML', false, embedHtmlString);
        onContentChange();
    };

    return (
        <div className="flex items-center w-full border-t-2 border-b-2 border-dark-secondary py-2 gap-1 my-2 relative select-none">
            <ToolbarButton title="Bold (Ctrl+B)" isActive={activeFormats.has('bold')} onClick={() => {
                execFormatSafe(editorRef, 'bold'); syncFormats(); onContentChange(); 
            }} className="font-bold text-medium">B</ToolbarButton>

            <ToolbarButton title="Italic (Ctrl+I)" isActive={activeFormats.has('italic')} onClick={() => {
                execFormatSafe(editorRef, 'italic'); syncFormats(); onContentChange(); 
            }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="4" x2="10" y2="4" /><line x1="14" y1="20" x2="5" y2="20" /><line x1="15" y1="4" x2="9" y2="20" /></svg>
            </ToolbarButton>

            <ToolbarButton title="Underline (Ctrl+U)" isActive={activeFormats.has('underline')} onClick={() => {
                execFormatSafe(editorRef, 'underline'); syncFormats(); onContentChange(); 
            }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3" /><line x1="4" y1="21" x2="20" y2="21" /></svg>
            </ToolbarButton>

            <ToolbarSeparator />

            <ToolbarButton title="Align left" isActive={activeFormats.has('justifyLeft')} onClick={() => handleAlign('justifyLeft')}>
                <svg width="18" height="15" viewBox="0 0 18 15" fill="none" stroke="currentColor" strokeWidth="2"><line x1="0" y1="1" x2="18" y2="1" /><line x1="0" y1="7" x2="12" y2="7" /><line x1="0" y1="13" x2="14" y2="13" /></svg>
            </ToolbarButton>
            <ToolbarButton title="Align center" isActive={activeFormats.has('justifyCenter')} onClick={() => handleAlign('justifyCenter')}>
                <svg width="18" height="15" viewBox="0 0 18 15" fill="none" stroke="currentColor" strokeWidth="2"><line x1="0" y1="1" x2="18" y2="1" /><line x1="3" y1="7" x2="15" y2="7" /><line x1="2" y1="13" x2="16" y2="13" /></svg>
            </ToolbarButton>
            <ToolbarButton title="Align right" isActive={activeFormats.has('justifyRight')} onClick={() => handleAlign('justifyRight')}>
                <svg width="18" height="15" viewBox="0 0 18 15" fill="none" stroke="currentColor" strokeWidth="2"><line x1="0" y1="1" x2="18" y2="1" /><line x1="6" y1="7" x2="18" y2="7" /><line x1="4" y1="13" x2="18" y2="13" /></svg>
            </ToolbarButton>
            <ToolbarButton title="Justify" isActive={activeFormats.has('justifyFull')} onClick={() => handleAlign('justifyFull')}>
                <svg width="18" height="15" viewBox="0 0 18 15" fill="none" stroke="currentColor" strokeWidth="2"><line x1="0" y1="1" x2="18" y2="1" /><line x1="0" y1="7" x2="18" y2="7" /><line x1="0" y1="13" x2="18" y2="13" /></svg>
            </ToolbarButton>

            <ToolbarSeparator />

            <div ref={menuRef} className="relative inline-block">
                <button
                    type="button"
                    title="Heading style"
                    onClick={() => setShowHeadingMenu((prev) => !prev)}
                    className="flex items-center gap-1.5 bg-transparent hover:bg-dark-surface-3 rounded-lg text-dark-secondary font-bold text-medium px-2 py-1 border-none cursor-pointer transition-colors"
                >
                    <span>{headingLabel ?? 'Heading'}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 ${showHeadingMenu ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9" /></svg>
                </button>

                {showHeadingMenu && (
                    <div className="absolute top-full left-0 mt-2 w-56 bg-dark-surface-2 border border-dark-secondary/30 rounded-xl p-1.5 flex flex-col gap-0.5 z-[100] shadow-[0_8px_30px_rgb(0,0,0,0.5)]">
                        {(['H1', 'H2', 'H3', 'H4', 'H5', 'H6'] as const).map((tag) => (
                            <button
                                key={tag}
                                type="button"
                                onClick={() => handleHeading(tag)}
                                className={`w-full text-left px-3 py-2 rounded-lg text-normal font-bold cursor-pointer transition-all border-none flex items-center justify-between ${
                                    headingLabel === tag
                                        ? 'bg-dark-surface-1 text-white'
                                        : 'bg-transparent text-dark-secondary hover:bg-dark-surface-3 hover:text-white'
                                }`}
                            >
                                <span>Heading {tag.slice(1)}</span>
                                <span className="text-xsmall opacity-40 font-mono">
                                    {headingSizes[tag]}
                                </span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <ToolbarSeparator />

            <ToolbarButton title="Bulleted list" isActive={activeFormats.has('ul')} onClick={() => {
                execFormatSafe(editorRef, 'insertUnorderedList'); syncFormats(); onContentChange(); 
            }}>
                <svg width="18" height="12" viewBox="0 0 18 12" fill="none" stroke="currentColor" strokeWidth="2"><line x1="6" y1="1" x2="18" y2="1" /><line x1="6" y1="6" x2="18" y2="6" /><line x1="6" y1="11" x2="18" y2="11" /><circle cx="2" cy="1" r="1.5" fill="currentColor" stroke="none" /><circle cx="2" cy="6" r="1.5" fill="currentColor" stroke="none" /><circle cx="2" cy="11" r="1.5" fill="currentColor" stroke="none" /></svg>
            </ToolbarButton>

            <ToolbarButton title="Insert link" onClick={handleInsertEmbedBlock}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
            </ToolbarButton>
        </div>
    );
};

export default NoteToolbar;