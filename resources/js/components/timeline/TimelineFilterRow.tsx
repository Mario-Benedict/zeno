import type { ReactNode } from 'react';
import CheckIcon from '@public/icons/small/check.svg';

interface Props {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}

const TimelineFilterRow = ({ active, onClick, children }: Props) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition ${
      active
        ? 'border border-dark-border bg-dark-surface-3'
        : 'border border-transparent hover:bg-dark-surface-3'
    }`}
  >
    <span className="min-w-0 flex-1">{children}</span>
    {active && <CheckIcon className="h-3 w-3 shrink-0 text-accent-blue" />}
  </button>
);

export default TimelineFilterRow;
