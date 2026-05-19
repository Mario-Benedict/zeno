/**
 * @file PersonalNotes.tsx
 * @description Halaman personal notes milik user yang sedang login.
 * Menampilkan daftar notes di panel kiri dan detail note yang dipilih di panel kanan.
 * Notes bersifat private — hanya bisa dilihat oleh pemiliknya.
 */

import { Head, Link } from '@inertiajs/react';
import React, { useState, useMemo, useEffect } from 'react';
import Header from '@/components/layouts/Header';
import Sidebar from '@/components/layouts/Sidebar';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NoteItem {
    id: number;
    title: string;
    description?: string;
    timeAgo?: string;
    content?: string;
    embedUrl?: string;
    embedTitle?: string;
}

interface PersonalNotesProps {
    projectSlug: string;
    initialNotes: NoteItem[];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/**
 * Tab switcher antara halaman Shared Notes dan Personal Notes.
 * Personal tab ditandai sebagai aktif (non-navigable button).
 */
const NoteTabSwitcher = ({ projectSlug }: { projectSlug: string }): React.ReactElement => (
    <div className="flex shrink-0 items-center p-4">
        <div className="flex items-center gap-1 rounded-[8px] bg-[#2E2E2E] p-1">
            <Link
                href={`/p/${projectSlug}/notes/shared`}
                className="flex items-center gap-2 rounded-[6px] px-4 py-2 text-[20px] font-bold leading-[28px] text-white/60 transition-colors duration-300 hover:text-white"
            >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Shared
            </Link>
            <button className="flex items-center gap-2 rounded-[6px] bg-[#111111] px-4 py-2 text-[20px] font-bold leading-[28px] text-white">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Personal
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
            </button>
        </div>
    </div>
);

/**
 * Toolbar formatting teks untuk area penulisan note.
 * Saat ini bersifat dekoratif (UI-only), belum terhubung ke rich text editor.
 * Border hanya di bawah sesuai desain Figma.
 */
const NoteToolbar = (): React.ReactElement => (
    <div className="mb-4 flex flex-wrap items-center gap-4 border-y-2 border-[#7F7F7F] py-2">
        <div className="flex items-center gap-4">
            <button title="Bold" className="flex h-6 w-6 items-center justify-center rounded text-base font-bold text-white/60 transition-colors duration-300 hover:text-white">B</button>
            <button title="Italic" className="flex h-6 w-6 items-center justify-center rounded text-base italic text-white/60 transition-colors duration-300 hover:text-white">I</button>
            <button title="Underline" className="flex h-6 w-6 items-center justify-center rounded text-base underline text-white/60 transition-colors duration-300 hover:text-white">U</button>
        </div>
        <div className="shrink-0 bg-[#7F7F7F]" style={{ width: '2px', height: '32px' }} />
        <div className="flex items-center gap-4">
            <button title="Align left" className="flex h-6 w-6 items-center justify-center rounded text-white/60 transition-colors duration-300 hover:text-white">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h10M4 18h12" /></svg>
            </button>
            <button title="Align center" className="flex h-6 w-6 items-center justify-center rounded text-white/60 transition-colors duration-300 hover:text-white">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M7 12h10M6 18h12" /></svg>
            </button>
            <button title="Align right" className="flex h-6 w-6 items-center justify-center rounded text-white/60 transition-colors duration-300 hover:text-white">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M10 12h10M8 18h12" /></svg>
            </button>
            <button title="Justify" className="flex h-6 w-6 items-center justify-center rounded text-white/60 transition-colors duration-300 hover:text-white">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
        </div>
        <div className="shrink-0 bg-[#7F7F7F]" style={{ width: '2px', height: '32px' }} />
        <button className="flex items-center gap-1 rounded px-2 py-1 text-[14px] font-semibold leading-[19.6px] text-white/60 transition-colors duration-300 hover:text-white">
            Heading
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
        </button>
        <div className="shrink-0 bg-[#7F7F7F]" style={{ width: '2px', height: '32px' }} />
        <div className="flex items-center gap-4">
            <button title="Bullet list" className="flex h-6 w-6 items-center justify-center rounded text-white/60 transition-colors duration-300 hover:text-white">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
            </button>
            <button title="Insert link" className="flex h-6 w-6 items-center justify-center rounded text-white/60 transition-colors duration-300 hover:text-white">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
            </button>
        </div>
    </div>
);

/**
 * Menampilkan link YouTube embed sebagai anchor yang bisa diklik.
 * Mengkonversi embed URL ke watch URL untuk membuka di tab baru.
 */
const NoteYoutubeEmbed = ({ embedUrl, embedTitle }: { embedUrl: string; embedTitle?: string }): React.ReactElement => (
    <a
        href={embedUrl.replace('/embed/', '/watch?v=')}
        target="_blank"
        rel="noopener noreferrer"
        className="mb-6 flex items-center gap-2 text-[18px] font-bold leading-[25.2px] text-white transition-opacity duration-300 hover:opacity-80"
    >
        <svg className="h-5 w-7 shrink-0" viewBox="0 0 28 20" fill="none">
            <rect width="28" height="20" rx="4" fill="#FF0000" />
            <path d="M11.5 14L18.5 10L11.5 6V14Z" fill="white" />
        </svg>
        <span className="underline">{embedTitle ?? 'Watch Video'}</span>
    </a>
);

/**
 * State kosong ketika tidak ada note yang dipilih atau tidak ada note sama sekali.
 */
const NoteEmptyState = (): React.ReactElement => (
    <div className="flex flex-1 items-center justify-center">
        <div className="flex max-w-[367px] flex-col items-center gap-4 text-center">
            <svg className="h-16 w-16 text-white/40" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <h3 className="text-[24px] font-bold leading-[26.4px] text-white">Your Private Space</h3>
            <p className="text-[16px] leading-[22.4px] text-white/60">
                This section is for your personal, private notes. You can keep track of private ideas and
                feedback here. All contents here are private. Your personal notes will appear here when
                you create them.
            </p>
        </div>
    </div>
);

/**
 * Panel detail note yang dipilih.
 * Title ditampilkan sebagai input yang bisa diedit (sesuai desain Figma "New page" placeholder).
 * Konten dipecah per paragraf berdasarkan double newline.
 */
const NoteDetail = ({ note }: { note: NoteItem }): React.ReactElement => (
    <>
        <input
            key={note.id}
            defaultValue={note.title}
            placeholder="New page"
            className="mb-6 w-full bg-transparent text-[32px] font-bold leading-[35.2px] text-white/40 placeholder-white/20 focus:outline-none"
        />
        <NoteToolbar />
        {note.embedUrl && (
            <NoteYoutubeEmbed embedUrl={note.embedUrl} embedTitle={note.embedTitle} />
        )}
        {note.content && (
            <div className="flex flex-col gap-4">
                {note.content.split('\n\n').map((paragraph, index) => (
                    <p key={index} className="text-[16px] leading-[22.4px] text-[#F0F0F0]">
                        {paragraph}
                    </p>
                ))}
            </div>
        )}
    </>
);

// ─── Main Component ───────────────────────────────────────────────────────────

/**
 * Halaman Personal Notes.
 *
 * Fitur:
 * - Daftar note di panel kiri dengan search/filter
 * - Detail note di panel kanan dengan toolbar formatting
 * - Auto-select note pertama saat load atau saat hasil filter berubah
 * - Note title bisa diedit langsung (editable input)
 */
const PersonalNotes = ({ projectSlug, initialNotes = [] }: PersonalNotesProps): React.ReactElement => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedNote, setSelectedNote] = useState<NoteItem | null>(initialNotes[0] ?? null);

    const filteredNotes = useMemo(
        () =>
            initialNotes.filter(
                (note) =>
                    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    note.description?.toLowerCase().includes(searchQuery.toLowerCase()),
            ),
        [searchQuery, initialNotes],
    );

    // Sinkronisasi selectedNote saat hasil filter berubah
    useEffect(() => {
        if (filteredNotes.length > 0) {
            const isStillVisible = filteredNotes.some((note) => note.id === selectedNote?.id);
            if (!isStillVisible) setSelectedNote(filteredNotes[0]);
        } else {
            setSelectedNote(null);
        }
    }, [filteredNotes, selectedNote]);

    return (
        <div className="flex h-dvh flex-col overflow-hidden bg-[#111111]" style={{ fontFamily: 'Figtree, sans-serif' }}>
            <Head title="Personal Notes" />
            <Header projectName="Project Zeno" />

            <div className="flex min-h-0 flex-1 overflow-hidden">
                <Sidebar projectSlug={projectSlug} />

                <div className="m-2 flex flex-1 gap-2 overflow-hidden rounded-[12px] border-2 border-[#3D3D3D] p-2">

                    {/* Panel kiri — daftar notes */}
                    <section className="flex w-[401px] shrink-0 flex-col overflow-hidden rounded-[8px] bg-[#242424] px-4 pb-4 pt-4">
                        <h2 className="mb-4 text-[32px] font-bold leading-[35.2px] text-white">Personal Notes</h2>

                        <div className="mb-4 flex h-9 w-full items-center gap-2 rounded-[8px] bg-[#2E2E2E] px-3 focus-within:ring-1 focus-within:ring-white/20">
                            <input
                                type="text"
                                placeholder="Search note..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-full flex-1 bg-transparent text-[14px] text-white placeholder-[#7F7F7F] focus:outline-none"
                            />
                            <svg className="h-4 w-4 shrink-0 text-[#7F7F7F]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>

                        <span className="mb-2 block shrink-0 text-[14px] font-semibold leading-[19.6px] text-[#7F7F7F]">Recent</span>

                        <div className="flex flex-1 flex-col gap-4 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            {filteredNotes.length > 0 ? (
                                filteredNotes.map((note) => (
                                    <button
                                        key={note.id}
                                        onClick={() => setSelectedNote(note)}
                                        className={`w-full cursor-pointer rounded-[8px] p-3 text-left transition-colors duration-300 ${
                                            selectedNote?.id === note.id
                                                ? 'bg-[#111111]'
                                                : 'bg-[#2E2E2E] hover:bg-[#111111]'
                                        }`}
                                    >
                                        <h4 className="mb-1 text-[20px] font-bold leading-[28px] text-white">{note.title}</h4>
                                        {note.timeAgo && (
                                            <p className="text-[14px] leading-[19.6px] text-[#7F7F7F]">{note.timeAgo}</p>
                                        )}
                                        {note.description && (
                                            <p className="line-clamp-2 text-[14px] leading-[19.6px] text-[#7F7F7F]">{note.description}</p>
                                        )}
                                    </button>
                                ))
                            ) : (
                                <p className="mt-4 text-center text-[14px] text-[#7F7F7F]">No notes found.</p>
                            )}
                        </div>
                    </section>

                    {/* Panel kanan — detail note */}
                    <main className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[8px] bg-[#242424]">
                        <NoteTabSwitcher projectSlug={projectSlug} />
                        <div className="flex flex-1 overflow-hidden px-4 pb-4">
                            <div className="flex flex-1 overflow-hidden rounded-[8px] bg-[#2E2E2E]">
                                {selectedNote ? (
                                    <div className="flex flex-1 flex-col overflow-y-auto p-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                        <NoteDetail note={selectedNote} />
                                    </div>
                                ) : (
                                    <NoteEmptyState />
                                )}
                            </div>
                        </div>
                    </main>

                </div>
            </div>
        </div>
    );
};

export default PersonalNotes;