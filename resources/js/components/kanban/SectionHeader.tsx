import type { ReactNode } from 'react';

interface Props {
  icon: ReactNode;
  label: string;
  action?: ReactNode;
}

export const SectionHeader = ({ icon, label, action }: Props) => (
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
