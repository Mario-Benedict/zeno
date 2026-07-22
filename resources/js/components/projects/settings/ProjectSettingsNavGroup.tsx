import type { ReactNode } from 'react';

interface ProjectSettingsNavGroupProps {
  label: string;
  children: ReactNode;
}

const ProjectSettingsNavGroup = ({
  label,
  children,
}: ProjectSettingsNavGroupProps) => (
  <div className="mb-3">
    <p className="mb-1 px-3 text-micro font-bold tracking-wider text-dark-secondary uppercase">
      {label}
    </p>
    <div className="space-y-0.5">{children}</div>
  </div>
);

export default ProjectSettingsNavGroup;
