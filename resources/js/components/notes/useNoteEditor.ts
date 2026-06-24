import { useCallback, useLayoutEffect, useEffect, useRef, useState } from 'react';
import type { NoteItem } from './types';

interface UseNoteEditorProps {
    note: NoteItem | null;
    onSave: (id: string, title: string, html: string) => void;
    defaultTitle: string;
    canEdit?: boolean; // default true, biar NoteEditorPanel (personal notes) gak perlu diubah
}

export const useNoteEditor = ({ note, onSave, defaultTitle, canEdit = true }: UseNoteEditorProps) => {
    const [title, setTitle] = useState('');
    const editorRef = useRef<HTMLDivElement>(null);
    const savedHtmlRef = useRef<string>('');
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const latestTitleRef = useRef(title);
    const canEditRef = useRef(canEdit);

    useEffect(() => {
        latestTitleRef.current = title;
    }, [title]);

    useEffect(() => {
        canEditRef.current = canEdit;
    }, [canEdit]);

    const saveCaretPosition = (element: HTMLDivElement): number => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return 0;
        const range = selection.getRangeAt(0);
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(element);
        preCaretRange.setEnd(range.startContainer, range.startOffset);
        return preCaretRange.toString().length;
    };

    const restoreCaretPosition = (element: HTMLDivElement, chars: number) => {
        if (chars < 0) return;
        const selection = window.getSelection();
        if (!selection) return;

        const range = document.createRange();
        range.setStart(element, 0);
        range.collapse(true);

        const nodeStack: Node[] = [element];
        let currentChars = 0;
        let found = false;

        while (nodeStack.length > 0 && !found) {
            const node = nodeStack.pop();
            if (!node) continue;

            if (node.nodeType === Node.TEXT_NODE) {
                const nextChars = currentChars + (node.textContent?.length ?? 0);
                if (chars >= currentChars && chars <= nextChars) {
                    range.setStart(node, chars - currentChars);
                    range.collapse(true);
                    found = true;
                }
                currentChars = nextChars;
            } else {
                let i = node.childNodes.length;
                while (i--) {
                    nodeStack.push(node.childNodes[i]);
                }
            }
        }

        selection.removeAllRanges();
        selection.addRange(range);
    };

    useLayoutEffect(() => {
        if (!note) {
            savedHtmlRef.current = '';
            if (editorRef.current) editorRef.current.innerHTML = '';
            const timer = setTimeout(() => setTitle(''), 0);
            return () => clearTimeout(timer);
        }

        const timer = setTimeout(() => {
            setTitle(note.title === defaultTitle ? '' : note.title);
        }, 0);

        const initialHtml = note.content?.html ?? note.content?.text ?? '';

        if (editorRef.current && editorRef.current.innerHTML !== initialHtml) {
            const caretPos = saveCaretPosition(editorRef.current);
            editorRef.current.innerHTML = initialHtml;
            restoreCaretPosition(editorRef.current, caretPos);
        }

        savedHtmlRef.current = initialHtml;

        return () => clearTimeout(timer);
    }, [note, defaultTitle]);

    const triggerSave = useCallback(() => {
        if (!note || !canEditRef.current) return; // ← guard
        const currentTitle = latestTitleRef.current.trim() || defaultTitle;
        const currentHtml = editorRef.current?.innerHTML ?? '';

        if (currentTitle !== note.title || currentHtml !== savedHtmlRef.current) {
            savedHtmlRef.current = currentHtml;
            onSave(note.id, currentTitle, currentHtml);
        }
    }, [note, onSave, defaultTitle]);

    const triggerDebounceSave = useCallback(() => {
        if (!canEditRef.current) return; // ← guard
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => {
            triggerSave();
        }, 500);
    }, [triggerSave]);

    useEffect(() => {
        const currentEditor = editorRef.current;

        return () => {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
            if (!note || !canEditRef.current) return; // ← guard, ini yang bikin bug-nya
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