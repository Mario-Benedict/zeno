import type { ReactNode } from 'react';

interface AccountMenuButtonProps {
  children: ReactNode;
  tone?: 'default' | 'danger';
  onClick: () => void;
}

const AccountMenuButton = ({
  children,
  tone = 'default',
  onClick,
}: AccountMenuButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-small font-medium transition-colors ${
      tone === 'danger'
        ? 'text-status-error hover:bg-status-error/10'
        : 'text-dark-primary hover:bg-white/[0.07]'
    }`}
  >
    {children}
  </button>
);

export default AccountMenuButton;
