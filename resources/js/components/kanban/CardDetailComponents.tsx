interface SectionHeaderProps {
  icon: React.ReactNode;
  label: string;
  action?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  icon,
  label,
  action,
}) => (
  <div className="mb-2 flex items-center justify-between">
    <div className="flex items-center gap-2">
      <span className="text-dark-secondary/80">{icon}</span>
      <span className="text-xsmall font-semibold tracking-wider text-dark-secondary uppercase">
        {label}
      </span>
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

export const SidebarButton: React.FC<SidebarButtonProps> = ({
  icon,
  label,
  onClick,
  active,
}) => (
  <button
    onClick={onClick}
    className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-small font-medium transition-all duration-150 ${
      active
        ? 'border border-accent-blue/30 bg-accent-blue/15 text-accent-blue'
        : 'border border-dark-border bg-dark-surface-2 text-dark-secondary hover:border-dark-border-focus hover:bg-dark-surface-3 hover:text-dark-primary'
    }`}
  >
    {/* Icon keeps its default color in every state — only the button's
        chrome and label reflect active/hover, so the icon itself never
        changes look. */}
    <span className="w-4 shrink-0 text-center text-dark-secondary">{icon}</span>
    <span>{label}</span>
  </button>
);
