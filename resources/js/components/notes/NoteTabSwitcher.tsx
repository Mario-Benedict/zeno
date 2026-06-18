import { Link } from '@inertiajs/react';
import React from 'react';

interface NoteTabSwitcherProps {
    projectSlug: string;
}

/**
 * Figma: 350×52px pill container (bg Surface-3, radius 16px).
 * Shared tab (left, inactive) | Personal tab (right, active bg Surface-1).
 */
const NoteTabSwitcher = ({ projectSlug }: NoteTabSwitcherProps): React.ReactElement => (
    <div className="flex items-center gap-1 bg-dark-surface-3 rounded-2xl p-1.5 shrink-0">
        {/* Shared tab (inactive) */}
        <Link
            href={`/p/${projectSlug}/notes/shared`}
            className="flex flex-1 h-10 items-center justify-center gap-2 rounded-2xl text-dark-primary font-bold text-large no-underline px-4"
        >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Shared
        </Link>

        {/* Personal tab (active) */}
        <div className="flex flex-1 h-10 bg-dark-surface-1 rounded-lg items-center justify-center gap-2 text-white font-bold text-large px-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
            </svg>
            Personal
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
            </svg>
        </div>
    </div>
);

export default NoteTabSwitcher;