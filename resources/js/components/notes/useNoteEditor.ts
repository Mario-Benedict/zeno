import { useCallback, useLayoutEffect, useEffect, useRef, useState } from 'react';
import type { NoteItem } from './types';

interface UseNoteEditorProps {
    note: NoteItem | null;
    onSave: (id: string, title: string, html: string) => void;
    defaultTitle: string;
}

export const useNoteEditor = ({ note, onSave, defaultTitle }: UseNoteEditorProps) => {
    const [title, setTitle] = useState('');
    const editorRef = useRef<HTMLDivElement>(null);
    const savedHtmlRef = useRef<string>('');
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const latestTitleRef = useRef(title);

    useEffect(() => {
        latestTitleRef.current = title;
    }, [title]);

    // Sinkronisasi judul dan HTML editor — gunakan useLayoutEffect sehingga perubahan state yang
    // perlu terjadi sebelum paint tidak memicu cascading renders yang dilaporkan oleh linter.
    useLayoutEffect(() => {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        
        if (!note) {
            setTitle('');
            savedHtmlRef.current = '';
            if (editorRef.current) editorRef.current.innerHTML = '';
            return;
        }

        // Set state judul dokumen secara aman
        setTitle(note.title === defaultTitle ? '' : note.title);

        // Masukkan HTML ke editor
        const initialHtml = note.content?.html ?? note.content?.text ?? '';
        savedHtmlRef.current = initialHtml;
        if (editorRef.current) {
            editorRef.current.innerHTML = initialHtml;
        }
    }, [note, defaultTitle]);

    const triggerSave = useCallback(() => {
        if (!note) return;
        const currentTitle = latestTitleRef.current.trim() || defaultTitle;
        const currentHtml = editorRef.current?.innerHTML ?? '';
        
        if (currentTitle !== note.title || currentHtml !== savedHtmlRef.current) {
            savedHtmlRef.current = currentHtml;
            onSave(note.id, currentTitle, currentHtml);
        }
    }, [note, onSave, defaultTitle]);

    const triggerDebounceSave = useCallback(() => {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => {
            triggerSave();
        }, 500);
    }, [triggerSave]);

    // Auto-save cleanup sewaktu berganti halaman/catatan
    useEffect(() => {
        const currentEditor = editorRef.current;
        return () => {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
            if (!note) return;
            const currentTitle = latestTitleRef.current.trim() || defaultTitle;
            const currentHtml = currentEditor?.innerHTML ?? '';
            if (currentTitle !== note.title || currentHtml !== savedHtmlRef.current) {
                onSave(note.id, currentTitle, currentHtml);
            }
        };
    }, [note, onSave, defaultTitle]);

    return {
        title,
        setTitle,
        editorRef,
        triggerSave,
        triggerDebounceSave
    };
};