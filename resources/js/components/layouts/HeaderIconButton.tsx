import type { ReactNode } from 'react';

interface HeaderIconButtonProps {
  label: string;
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
}

const HeaderIconButton = ({
  label,
  disabled = false,
  onClick,
  children,
}: HeaderIconButtonProps) => (
  <button
    type="button"
    aria-label={label}
    disabled={disabled}
    onClick={onClick}
    className="flex h-8 w-8 items-center justify-center rounded-full bg-dark-surface-2 text-dark-primary transition-colors hover:bg-dark-surface-3 disabled:cursor-not-allowed disabled:opacity-40"
  >
    {children}
  </button>
);

export default HeaderIconButton;
