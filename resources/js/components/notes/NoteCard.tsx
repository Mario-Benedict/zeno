import { NoteItem } from './types';
import React from 'react';

interface NoteCardProps {
    note: NoteItem;
    isActive: boolean;
    onSelect: (note: NoteItem) => void;
    onDeleteRequest: (id: string) => void;
}

const NoteCard = ({ note, isActive, onSelect, onDeleteRequest }: NoteCardProps): React.ReactElement => (
    <div
        role="button"
        tabIndex={0}
        onClick={() => onSelect(note)}
        onKeyDown={(e) => e.key === 'Enter' && onSelect(note)}
        className={`
            w-[369px] h-[74px] rounded-lg border-2 px-[25px] py-[9px]
            cursor-pointer relative flex flex-col justify-center gap-1 box-border shrink-0 transition-colors duration-150
            ${isActive
                ? 'bg-dark-surface-1 border-dark-surface-1'
                : 'bg-dark-surface-3 border-dark-surface-3 hover:bg-dark-surface-1 hover:border-dark-surface-1'
            }
        `}
    >
        <p className="text-white font-bold text-large m-0 overflow-hidden text-ellipsis whitespace-nowrap pr-7">
            {note.title}
        </p>

        {note.timeAgo && (
            <p className="text-white/60 text-small font-normal m-0 overflow-hidden text-ellipsis whitespace-nowrap pr-7">
                {note.timeAgo}
            </p>
        )}

        <button
            onClick={(e) => { e.stopPropagation(); onDeleteRequest(note.id); }}
            title="Delete note"
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-dark-secondary hover:text-white p-1 rounded flex items-center justify-center transition-colors"
        >
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
        </button>
    </div>
);

export default NoteCard;