import React from 'react';

interface SectionHeaderProps {
    icon: React.ReactNode;
    label: string;
    action?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ icon, label, action }) => (
    <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
            <span className="text-white/30">{icon}</span>
            <span className="text-xsmall font-semibold text-white/50 uppercase tracking-wider">{label}</span>
        </div>
        {action && <span>{action}</span>}
    </div>
);

interface SidebarButtonProps {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    active?: boolean;
}

export const SidebarButton: React.FC<SidebarButtonProps> = ({ icon, label, onClick, active }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-small font-medium transition-all duration-150 text-left ${
            active
                ? 'bg-accent-blue/15 text-accent-blue border border-accent-blue/30'
                : 'bg-dark-surface-2 hover:bg-dark-surface-3 text-white/50 hover:text-white border border-dark-border hover:border-dark-border-focus'
        }`}
    >
        <span className="shrink-0 w-4 text-center">{icon}</span>
        <span>{label}</span>
    </button>
);
