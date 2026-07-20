import type { ButtonHTMLAttributes } from 'react';

type ButtonProps = {
  loading?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const Button = ({
  loading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) => (
  <button
    disabled={loading || disabled}
    className={`cursor-pointer rounded-lg bg-dark-surface-3 px-4 py-2.5 text-sm font-medium text-dark-primary transition-colors hover:bg-dark-secondary disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    {...props}
  >
    {children}
  </button>
);

export default Button;
