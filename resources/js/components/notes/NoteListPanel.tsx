import React from 'react';
import NoteCard from './NoteCard';
import type { NoteItem } from './types';

interface NoteListPanelProps {
    title?: string; // Properti opsional untuk mengubah nama header secara dinamis
    notes: NoteItem[];
    selectedNote: NoteItem | null;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onSelectNote: (note: NoteItem) => void;
    onCreateNote: () => void;
    onDeleteRequest: (id: string) => void;
}

/**
 * Figma: Left panel 401×886px, bg Surface-2, radius 8px.
 * Contains: title + create button, search bar, "Recent" label, note cards list.
 */
const NoteListPanel = ({
    title = 'Personal Notes', // Default title jika tidak dikirim dari komponen induk
    notes,
    selectedNote,
    searchQuery,
    onSearchChange,
    onSelectNote,
    onCreateNote,
    onDeleteRequest,
}: NoteListPanelProps): React.ReactElement => (
    <section className="w-[401px] shrink-0 bg-dark-surface-2 rounded-lg relative overflow-hidden flex flex-col box-border border border-dark-border/10">
        {/* Header: title + create button */}
        <div className="px-4 pt-4">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-bold text-h4 m-0">{title}</h2>
                <button
                    onClick={onCreateNote}
                    title="New note"
                    className="w-8 h-8 flex items-center justify-center bg-dark-surface-3 border-none rounded-lg text-dark-secondary shrink-0 cursor-pointer hover:bg-dark-surface-1 hover:text-white transition-colors duration-150"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                </button>
            </div>

            {/* Search bar */}
            <div className="w-[369px] h-[42px] bg-dark-surface-3 rounded-lg mb-4 flex items-center box-border border border-dark-border/40">
                <input
                    type="text"
                    placeholder="Search note..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="flex-1 h-full bg-transparent border-none outline-none pl-4 text-dark-secondary font-bold text-medium placeholder:text-dark-secondary/40"
                />
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3 shrink-0 text-dark-secondary">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
            </div>

            <span className="text-white/60 font-bold text-large block mb-2">Recent</span>
        </div>

        {/* Note card list dengan scrollbar tersembunyi total */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {notes.length > 0 ? (
                notes.map((note) => (
                    <NoteCard
                        key={note.id}
                        note={note}
                        isActive={selectedNote?.id === note.id}
                        onSelect={onSelectNote}
                        onDeleteRequest={onDeleteRequest}
                    />
                ))
            ) : (
                <p className="text-center text-dark-secondary text-small mt-4">No notes found.</p>
            )}
        </div>
    </section>
);

export default NoteListPanel;