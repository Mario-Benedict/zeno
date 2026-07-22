import type { NoteCollaboratorRole } from '@/types/notes';
import TrashIcon from '@public/icons/small/trash.svg';
import CollaboratorRoleSelect from './CollaboratorRoleSelect';

interface NoteCollaboratorRowProps {
  name: string;
  email: string;
  role: NoteCollaboratorRole;
  onRoleChange: (role: NoteCollaboratorRole) => void;
  onRemove: () => void;
  roleLabels: Record<NoteCollaboratorRole, string>;
  removeLabel: string;
}

const getInitials = (name: string): string =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

/** One pending or existing note collaborator. */
const NoteCollaboratorRow = ({
  name,
  email,
  role,
  onRoleChange,
  onRemove,
  roleLabels,
  removeLabel,
}: NoteCollaboratorRowProps) => (
  <div className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-white/[0.04]">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-blue text-xsmall font-bold text-white">
      {getInitials(name)}
    </div>
    <div className="min-w-0 flex-1">
      <p className="truncate text-small font-semibold text-dark-primary">
        {name}
      </p>
      <p className="truncate text-xsmall text-dark-secondary">{email}</p>
    </div>
    <CollaboratorRoleSelect
      value={role}
      onChange={onRoleChange}
      roleLabels={roleLabels}
    />
    <button
      type="button"
      aria-label={removeLabel}
      onClick={onRemove}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-dark-secondary transition-colors hover:bg-accent-red/15 hover:text-accent-red"
    >
      <TrashIcon />
    </button>
  </div>
);

export default NoteCollaboratorRow;
