import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { FloatingMenu } from '@/components/shared/FloatingMenu';
import { useTranslation } from '@/hooks/useTranslation';
import type { AssignableProjectRole } from '@/types';
import ArrowDownIcon from '@public/icons/small/arrow_down.svg';
import CheckIcon from '@public/icons/small/check.svg';

export const useRoleLabels = (): Record<AssignableProjectRole, string> => {
  const { t } = useTranslation();

  return {
    ADMIN: t('common.admin'),
    MEMBER: t('common.member'),
    VIEWER: t('common.viewer'),
  };
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

export const SavedBadge = ({ visible }: { visible: boolean }) => {
  const { t } = useTranslation();

  return (
    <span
      className={`flex items-center gap-1.5 text-xsmall font-semibold text-status-success transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
    >
      <CheckIcon />
      {t('projectSettingsTabs.saved')}
    </span>
  );
};

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
  const triggerRef = useRef<HTMLButtonElement>(null);
  const roleLabels = useRoleLabels();

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-8 items-center gap-1.5 rounded-md border border-dark-border bg-dark-surface-3 pr-2 pl-3 text-xsmall font-semibold text-dark-primary transition-colors hover:border-dark-border-focus disabled:cursor-not-allowed disabled:opacity-40"
      >
        {roleLabels[value]}
        <span
          className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        >
          <ArrowDownIcon />
        </span>
      </button>
      <FloatingMenu
        open={open}
        onClose={() => setOpen(false)}
        triggerRef={triggerRef}
        role="listbox"
        className="min-w-28"
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
            {roleLabels[role]}
          </button>
        ))}
      </FloatingMenu>
    </>
  );
};
