import type { ReactNode } from 'react';

interface Props {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}

export const SidebarButton = ({ icon, label, onClick, active }: Props) => (
  <button
    onClick={onClick}
    className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-small font-medium transition-all duration-150 ${
      active
        ? 'border border-accent-blue/30 bg-accent-blue/15 text-accent-blue'
        : 'border border-dark-border bg-dark-surface-2 text-dark-secondary hover:border-dark-border-focus hover:bg-dark-surface-3 hover:text-dark-primary'
    }`}
  >
    <span className="w-4 shrink-0 text-center text-dark-secondary">{icon}</span>
    <span>{label}</span>
  </button>
);
