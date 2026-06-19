import { Link } from '@inertiajs/react';
import React from 'react';

export type NoteTab = 'personal' | 'shared';

interface NoteTabSwitcherProps {
    projectSlug: string;
    activeTab: NoteTab;
}

const NoteTabSwitcher = ({ projectSlug, activeTab }: NoteTabSwitcherProps): React.ReactElement => {
    const isSharedActive = activeTab === 'shared';
    const isPersonalActive = activeTab === 'personal';

    return (
        <div className="flex w-[350px] h-[52px] items-center bg-dark-surface-3 rounded-2xl p-1 box-border shrink-0 select-none border border-dark-border/10">
            
            {/* ── SHARED TAB ── */}
            {isSharedActive ? (
                <div className="flex flex-1 h-full bg-dark-surface-1 rounded-xl items-center justify-center gap-2 text-white font-bold text-normal px-3 transition-all duration-150">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <span>Shared</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-0.5">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                </div>
            ) : (
                <Link
                    href={`/p/${projectSlug}/notes/shared`}
                    className="flex flex-1 h-full items-center justify-center gap-2 rounded-xl text-dark-secondary font-bold text-normal no-underline px-3 hover:text-white transition-all duration-150"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <span>Shared</span>
                </Link>
            )}

            {/* ── PERSONAL TAB ── */}
            {isPersonalActive ? (
                <div className="flex flex-1 h-full bg-dark-surface-1 rounded-xl items-center justify-center gap-2 text-white font-bold text-normal px-3 transition-all duration-150">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span>Personal</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-0.5">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                </div>
            ) : (
                <Link
                    href={`/p/${projectSlug}/notes/personal`}
                    className="flex flex-1 h-full items-center justify-center gap-2 rounded-xl text-dark-secondary font-bold text-normal no-underline px-3 hover:text-white transition-all duration-150"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span>Personal</span>
                </Link>
            )}

        </div>
    );
};

export default NoteTabSwitcher;