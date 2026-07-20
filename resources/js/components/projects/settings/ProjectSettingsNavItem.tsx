interface ProjectSettingsNavItemProps {
  label: string;
  active: boolean;
  danger?: boolean;
  onClick: () => void;
}

const ProjectSettingsNavItem = ({
  label,
  active,
  danger,
  onClick,
}: ProjectSettingsNavItemProps) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full rounded-md px-3 py-2 text-left text-small font-medium transition-colors ${
      active
        ? 'bg-white/[0.1] text-dark-primary'
        : danger
          ? 'text-status-error hover:bg-status-error/10'
          : 'text-dark-secondary hover:bg-white/[0.07] hover:text-dark-primary'
    }`}
  >
    {label}
  </button>
);

export default ProjectSettingsNavItem;
