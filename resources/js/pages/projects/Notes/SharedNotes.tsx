/**
 * @file SharedNotes.tsx
 */

import { Head, Link } from '@inertiajs/react';
import React, { useState, useMemo, useEffect } from 'react';
import Header from '@/components/layouts/Header';
import Sidebar from '@/components/layouts/Sidebar';

interface NoteItem {
    id: number;
    title: string;
    description?: string;
    timeAgo?: string;
    content?: string;
    embedUrl?: string;
    embedTitle?: string;
}

interface Collaborator {
    id: number;
    name: string;
    role: string;
    avatarUrl?: string;
}

interface SharedNotesProps {
    projectSlug: string;
    initialNotes: NoteItem[];
    collaborators: Collaborator[];
}

const NoteTabSwitcher = ({ projectSlug }: { projectSlug: string }): React.ReactElement => (
    <div className="flex shrink-0 items-center p-4">
        <div className="flex items-center gap-1 rounded-[8px] bg-[#2E2E2E] p-1">
            <button className="flex items-center gap-2 rounded-[6px] bg-[#111111] px-4 py-2 text-[20px] font-bold leading-[28px] text-white">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Shared
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
            </button>
            <Link
                href={`/p/${projectSlug}/notes/personal`}
                className="flex items-center gap-2 rounded-[6px] px-4 py-2 text-[20px] font-bold leading-[28px] text-white/60 transition-colors duration-300 hover:text-white"
            >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Personal
            </Link>
        </div>
    </div>
);

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

const NoteEmptyState = (): React.ReactElement => (
    <div className="flex flex-1 items-center justify-center">
        <div className="flex max-w-[367px] flex-col items-center gap-4 text-center">
            <svg className="h-16 w-16 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <h3 className="text-[24px] font-bold leading-[26.4px] text-white">Select a Note</h3>
            <p className="text-[16px] leading-[22.4px] text-white/60">
                Choose a note from the list on the left to start collaborating,
                view details, and provide feedback. All collaborators will see your selections.
            </p>
        </div>
    </div>
);

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

/**
 * Menampilkan daftar collaborator di panel kanan note.
 * Avatar 48x48px dengan fallback SVG icon jika avatarUrl tidak tersedia.
 */
const CollaboratorPanel = ({ collaborators }: { collaborators: Collaborator[] }): React.ReactElement => (
    <aside className="flex w-[100px] shrink-0 flex-col gap-3 overflow-y-auto pl-4 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <span className="text-center text-[11px] font-semibold leading-[16px] text-[#7F7F7F]">Collaborators</span>
        <div className="flex flex-col gap-3">
            {collaborators.map((collaborator) => (
                <div key={collaborator.id} className="flex flex-col items-center gap-1 text-center">
                    <div className="flex h-[48px] w-[48px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#3D3D3D]">
                        {collaborator.avatarUrl ? (
                            <img
                                src={collaborator.avatarUrl}
                                alt={collaborator.name}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <svg className="h-5 w-5 text-white/60" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                            </svg>
                        )}
                    </div>
                    <p className="text-[10px] font-bold leading-[16px] text-white">{collaborator.name}</p>
                    <p className="text-[10px] leading-[16px] text-white/60">({collaborator.role})</p>
                </div>
            ))}
        </div>
    </aside>
);

const SharedNotes = ({ projectSlug, initialNotes = [], collaborators = [] }: SharedNotesProps): React.ReactElement => {
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
            <Head title="Shared Notes" />
            <Header projectName="Project Zeno" />

            <div className="flex min-h-0 flex-1 overflow-hidden">
                <Sidebar projectSlug={projectSlug} />

                <div className="m-2 flex flex-1 gap-2 overflow-hidden rounded-[12px] border-2 border-[#3D3D3D] p-2">

                    {/* Panel kiri — daftar notes */}
                    <section className="flex w-[401px] shrink-0 flex-col overflow-hidden rounded-[8px] bg-[#242424] px-4 pb-4 pt-4">
                        <h2 className="mb-4 text-[32px] font-bold leading-[35.2px] text-white">Shared Notes</h2>

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

                    {/* Panel kanan — tab switcher + box notes + collaborator panel */}
                    <main className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[8px] bg-[#242424]">
                        <NoteTabSwitcher projectSlug={projectSlug} />
                        <div className="flex flex-1 overflow-hidden px-4 pb-4">

                            {/* Box notes */}
                            <div className="flex flex-1 overflow-hidden rounded-[8px] bg-[#2E2E2E]">
                                {selectedNote ? (
                                    <div className="flex flex-1 flex-col overflow-y-auto p-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                        <NoteDetail note={selectedNote} />
                                    </div>
                                ) : (
                                    <NoteEmptyState />
                                )}
                            </div>

                            {/* Separator + Collaborator panel */}
                            {selectedNote && (
                                <>
                                    <div className="ml-4 shrink-0 rounded-[24px] bg-[#3D3D3D]" style={{ width: '2px', height: '100%' }} />
                                    <CollaboratorPanel collaborators={collaborators} />
                                </>
                            )}

                        </div>
                    </main>

                </div>
            </div>
        </div>
    );
};

export default SharedNotes;