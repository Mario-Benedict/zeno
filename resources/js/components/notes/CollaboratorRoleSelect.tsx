import { useRef, useState } from 'react';
import { FloatingMenu } from '@/components/shared/FloatingMenu';
import type { NoteCollaboratorRole } from '@/types/notes';
import ChevronDownIcon from '@public/icons/small/chevron_down.svg';

interface CollaboratorRoleSelectProps {
  value: NoteCollaboratorRole;
  disabled?: boolean;
  onChange: (role: NoteCollaboratorRole) => void;
  roleLabels: Record<NoteCollaboratorRole, string>;
}

/** Role dropdown for a note collaborator row. */
const CollaboratorRoleSelect = ({
  value,
  disabled,
  onChange,
  roleLabels,
}: CollaboratorRoleSelectProps) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-dark-border bg-dark-surface-3 pr-2 pl-3 text-xsmall font-semibold text-dark-primary transition-colors hover:border-dark-border-focus focus:outline-none disabled:cursor-not-allowed disabled:opacity-40"
      >
        {roleLabels[value]}
        <span
          className={`text-dark-secondary transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        >
          <ChevronDownIcon />
        </span>
      </button>

      <FloatingMenu
        open={open}
        onClose={() => setOpen(false)}
        triggerRef={triggerRef}
        role="listbox"
        className="min-w-24"
      >
        {(['Editor', 'Viewer'] as NoteCollaboratorRole[]).map((role) => (
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

export default CollaboratorRoleSelect;
