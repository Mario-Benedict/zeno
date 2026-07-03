import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { AssignableProjectRole } from '@/types';
import ArrowDownIcon from '@public/icons/small/arrow_down.svg';
import CheckIcon from '@public/icons/small/check.svg';

export const ROLE_LABELS: Record<AssignableProjectRole, string> = {
  ADMIN: 'Admin',
  MEMBER: 'Member',
  VIEWER: 'Viewer',
};

export const inputClass =
  'w-full rounded-lg border border-dark-border bg-dark-input px-3 py-2.5 text-small text-dark-primary outline-none placeholder:text-dark-secondary transition-colors focus:border-dark-border-focus focus:bg-dark-input-focus disabled:cursor-not-allowed disabled:opacity-50';

export const getInitials = (name: string) =>
  name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

export const FieldLabel = ({ children }: { children: ReactNode }) => (
  <p className="mb-1.5 text-xsmall font-semibold tracking-wide text-dark-secondary uppercase">
    {children}
  </p>
);

export const SavedBadge = ({ visible }: { visible: boolean }) => (
  <span
    className={`flex items-center gap-1.5 text-xsmall font-semibold text-status-success transition-opacity duration-300 ${
      visible ? 'opacity-100' : 'pointer-events-none opacity-0'
    }`}
  >
    <CheckIcon />
    Saved
  </span>
);

export const RoleSelect = ({
  value,
  roles,
  disabled,
  onChange,
}: {
  value: AssignableProjectRole;
  roles: AssignableProjectRole[];
  disabled?: boolean;
  onChange: (role: AssignableProjectRole) => void;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-8 items-center gap-1.5 rounded-md border border-dark-border bg-dark-surface-3 pr-2 pl-3 text-xsmall font-semibold text-dark-primary transition-colors hover:border-dark-border-focus disabled:cursor-not-allowed disabled:opacity-40"
      >
        {ROLE_LABELS[value]}
        <span
          className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        >
          <ArrowDownIcon />
        </span>
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute top-full right-0 z-50 mt-1 min-w-28 overflow-hidden rounded-lg border border-dark-border bg-dark-surface-2 py-1 shadow-2xl"
        >
          {roles.map((role) => (
            <button
              key={role}
              type="button"
              role="option"
              aria-selected={role === value}
              onClick={() => {
                onChange(role);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xsmall font-medium transition-colors hover:bg-white/[0.07] ${
                role === value ? 'text-dark-primary' : 'text-dark-secondary'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${role === value ? 'bg-accent-blue' : ''}`}
              />
              {ROLE_LABELS[role]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
