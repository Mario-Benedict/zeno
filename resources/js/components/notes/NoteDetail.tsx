import React, { useCallback, useEffect, useRef, useState } from 'react';
import NoteToolbar from './NoteToolbar';

/**
 * Komponen Utama Editor Catatan (Right Panel).
 * Menggunakan arsitektur blok inline terisolasi Google Docs untuk penanganan multi-embed,
 * auto-save real-time ter-debounce, dan pencegahan bug delesi tombol Backspace.
 */
const NoteDetail = ({ note, onSave }: { note: any; onSave: (id: string, title: string, html: string) => void }): React.ReactElement => {
    // Memberikan Null Guard (?.) agar tidak crash jika objek note belum siap/kosong
    const [title, setTitle] = useState(note?.title === 'Untitled' ? '' : (note?.title ?? ''));
    const editorRef = useRef<HTMLDivElement>(null);
    
    // Fallback aman bertingkat untuk mendeteksi isi HTML tanpa memicu crash runtime
    const getInitialHtml = () => {
        if (!note) return '';
        if (note.content?.html) return note.content.html;
        if (note.content?.text) return note.content.text;
        if (typeof note.content === 'string') return note.content;
        return '';
    };

    const savedHtmlRef = useRef<string>(getInitialHtml());
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Siklus pelepasan komponen (Unmount Lifecycle) - Memastikan data terakhir tersimpan
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
            const currentTitle = title.trim() || 'Untitled';
            const currentHtml = editorRef.current?.innerHTML ?? '';
            if (currentTitle !== note?.title || currentHtml !== savedHtmlRef.current) {
                if (note?.id) {
                    onSave(note.id, currentTitle, currentHtml);
                }
            }
        };
    }, [note?.id]);

    // Siklus pergantian catatan aktif dengan sistem pengaman Runtime Crash berlapis
    useEffect(() => {
        if (!note) return;
        try {
            setTitle(note.title === 'Untitled' ? '' : (note.title ?? ''));
            const initialHtml = note?.content?.html ?? note?.content?.text ?? (typeof note?.content === 'string' ? note.content : '');
            savedHtmlRef.current = initialHtml;
            
            if (editorRef.current) {
                editorRef.current.innerHTML = initialHtml;
            }
        } catch (error) {
            console.error("Gagal menyinkronkan data catatan:", error);
        }
    }, [note?.id, note]);

    /**
     * Membuka jembatan router Inertia untuk menyimpan data permanen ke basis data Laravel.
     */
    const triggerSave = useCallback(() => {
        if (!note?.id) return;
        const currentTitle = title.trim() || 'Untitled';
        const currentHtml = editorRef.current?.innerHTML ?? '';
        if (currentTitle !== note.title || currentHtml !== savedHtmlRef.current) {
            savedHtmlRef.current = currentHtml;
            onSave(note.id, currentTitle, currentHtml);
        }
    }, [note?.id, note?.title, title, onSave]);

    /**
     * Mesin Auto-Save Otomatis (Debounce 500ms) untuk mengamankan data ketikan saat refresh tidak sengaja.
     */
    const triggerDebounceSave = useCallback(() => {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => {
            triggerSave();
        }, 500);
    }, [triggerSave]);

    const handleEditorInput = useCallback(() => {
        triggerDebounceSave();
    }, [triggerDebounceSave]);

    /**
     * Google Docs Key Interceptor.
     * Mengelola pembentukan otomatis bullet-point (- ) dan mengisolasi perlindungan backspace baris teks.
     */
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        const editor = editorRef.current;
        if (!editor) return;

        // Transformasi otomatis kode ketikan "- " menjadi struktur Bullet List
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
                    return;
                }
            }
        }

        // Penanganan tombol Backspace Terisolasi (Mencegah penghapusan tidak sengaja pada blok baris atas)
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

                // JIKA USER DI BARIS BULLET POINT KOSONG: Hancurkan format bullet-nya saja, jangan lompat ke atas!
                if (currentBlock && currentBlock.tagName === 'LI' && range.startOffset === 0) {
                    const hasText = currentBlock.textContent && currentBlock.textContent.length > 0;
                    if (!hasText) {
                        e.preventDefault();
                        document.execCommand('insertUnorderedList', false); // Kembalikan ke paragraf p biasa
                        return;
                    }
                }
            }
            triggerDebounceSave();
        }
    };

    return (
        <div className="flex flex-col flex-1 w-full text-dark-primary p-6 box-border select-text">
            {/* Input Judul Utama Catatan */}
            <input
                value={title}
                onChange={(e) => { setTitle(e?.target?.value ?? ''); triggerDebounceSave(); }}
                onBlur={triggerSave}
                placeholder="New page"
                className="w-full bg-transparent border-none outline-none font-bold text-h3 mb-4 box-border placeholder:text-dark-secondary text-dark-primary font-sans"
            />

            {/* Toolbar Kontrol Aksi Rich Text Format */}
            <NoteToolbar editorRef={editorRef} />

            {/* Area Kanvas Teks Utama (ContentEditable Container) dengan standar Padding Eksak 24px (p-6) */}
            <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onBlur={triggerSave}
                onInput={handleEditorInput}
                onKeyDown={handleKeyDown}
                data-placeholder="Start writing..."
                className="
                    flex-1 min-h-[350px] mt-4 outline-none text-white break-words font-sans
                    [&_h1]:text-[56px] [&_h1]:leading-[61.6px] [&_h1]:font-bold [&_h1]:my-4
                    [&_h2]:text-[48px] [&_h2]:leading-[52.8px] [&_h2]:font-bold [&_h2]:my-4
                    [&_h3]:text-[40px] [&_h3]:leading-[44px] [&_h3]:font-bold [&_h3]:my-3
                    [&_h4]:text-[32px] [&_h4]:leading-[35.2px] [&_h4]:font-bold [&_h4]:my-3
                    [&_h5]:text-[24px] [&_h5]:leading-[26.4px] [&_h5]:font-bold [&_h5]:my-2
                    [&_h6]:text-[20px] [&_h6]:leading-[22px] [&_h6]:font-bold [&_h6]:my-2
                    [&_p]:text-[16px] [&_p]:leading-[22.4px] [&_p]:my-1.5
                    [&_ul]:list-disc [&_ul]:pl-8 [&_ul]:my-2
                    [&_li]:pl-1 [&_li]:my-1
                    empty:before:content-[attr(data-placeholder)] empty:before:text-dark-secondary empty:before:pointer-events-none
                    
                    /* Styling khusus kartu Multi-Embed Card di dalam editor */
                    [&_.embed-card-block]:block [&_.embed-card-block]:w-full [&_.embed-card-block]:bg-[#1E1E1E] 
                    [&_.embed-card-block]:border [&_.embed-card-block]:border-dark-secondary/10 [&_.embed-card-block]:rounded-xl 
                    [&_.embed-card-block]:px-4 [&_.embed-card-block]:py-3 [&_.embed-card-block]:my-3 [&_.embed-card-block]:no-underline
                    hover:[&_.embed-card-block]:bg-dark-surface-3 transition-colors duration-150
                "
            />
        </div>
    );
};

export default NoteDetail;