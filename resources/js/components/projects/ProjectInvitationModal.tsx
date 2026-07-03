import { router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { projectPath } from '@/lib/accountRoutes';
import type {
  AssignableProjectRole,
  CurrentProject,
  ProjectMember,
  ProjectShare,
} from '@/types';

interface ProjectInvitationModalProps {
  open: boolean;
  project: CurrentProject | null;
  share: ProjectShare | null;
  onClose: () => void;
}

const ROLE_LABELS: Record<AssignableProjectRole, string> = {
  ADMIN: 'Admin',
  MEMBER: 'Member',
  VIEWER: 'Viewer',
};

const XIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const LinkIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

const TrashIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 6h18" />
    <path d="M8 6V4h8v2" />
    <path d="M19 6l-1 14H6L5 6" />
  </svg>
);

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const ChevronDownIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const RoleSelect = ({
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
    const handleClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-9 items-center gap-1.5 rounded-md border border-dark-border bg-dark-surface-3 pr-2 pl-3 text-xsmall font-semibold text-dark-primary transition-colors hover:border-dark-border-focus hover:bg-dark-surface-3 focus:outline-none disabled:cursor-not-allowed disabled:opacity-40"
      >
        {ROLE_LABELS[value]}
        <span
          className={`text-dark-secondary transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        >
          <ChevronDownIcon />
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
              {role === value && (
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent-blue" />
              )}
              {role !== value && <span className="h-1.5 w-1.5 shrink-0" />}
              {ROLE_LABELS[role]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const MemberRow = ({
  member,
  roles,
  canManage,
  onRoleChange,
  onRemove,
}: {
  member: ProjectMember;
  roles: AssignableProjectRole[];
  canManage: boolean;
  onRoleChange: (member: ProjectMember, role: AssignableProjectRole) => void;
  onRemove: (member: ProjectMember) => void;
}) => {
  const canEdit =
    canManage && member.role !== 'OWNER' && !member.is_current_user;

  return (
    <div className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-white/[0.04]">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-blue text-xs font-bold text-white">
        {getInitials(member.name)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-dark-primary">
          {member.name}
          {member.is_current_user ? ' (you)' : ''}
        </p>
        <p className="truncate text-xs text-dark-secondary">{member.email}</p>
      </div>
      {member.role === 'OWNER' ? (
        <span className="rounded-md border border-dark-border px-3 py-2 text-sm font-medium text-dark-secondary">
          Owner
        </span>
      ) : (
        <RoleSelect
          value={member.role}
          roles={roles}
          disabled={!canEdit}
          onChange={(role) => onRoleChange(member, role)}
        />
      )}
      {canEdit && (
        <button
          type="button"
          aria-label={`Remove ${member.name}`}
          onClick={() => onRemove(member)}
          className="flex h-9 w-9 items-center justify-center rounded-md text-dark-secondary transition-colors hover:bg-accent-red/15 hover:text-accent-red"
        >
          <TrashIcon />
        </button>
      )}
    </div>
  );
};

const ProjectInvitationModal = ({
  open,
  project,
  share,
  onClose,
}: ProjectInvitationModalProps) => {
  const { account } = usePage().props;
  const accountIndex = account.index;
  const roles = useMemo<AssignableProjectRole[]>(
    () => share?.assignable_roles ?? ['MEMBER', 'ADMIN', 'VIEWER'],
    [share?.assignable_roles],
  );
  const defaultRole = share?.invitation_link?.role ?? 'MEMBER';
  const [selectedLinkRole, setSelectedLinkRole] =
    useState<AssignableProjectRole | null>(null);
  const [copied, setCopied] = useState(false);
  const [linkProcessing, setLinkProcessing] = useState(false);
  const linkRole = selectedLinkRole ?? defaultRole;
  const inviteForm = useForm<{
    invitee: string;
    role: AssignableProjectRole;
  }>({
    invitee: '',
    role: 'MEMBER',
  });

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKeyDown);

    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose, open]);

  if (!open || project === null || share === null) return null;

  const canManage = share.can_manage_members;
  const invitationLink = share.invitation_link;

  const submitInvitation = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canManage) return;

    inviteForm.post(
      projectPath(accountIndex, project.project_slug, '/invitations'),
      {
        preserveScroll: true,
        onSuccess: () => inviteForm.reset('invitee'),
      },
    );
  };

  const saveLink = () => {
    if (!canManage) return;

    setLinkProcessing(true);
    const options = {
      preserveScroll: true,
      onSuccess: () => setSelectedLinkRole(null),
      onFinish: () => setLinkProcessing(false),
    };

    if (invitationLink) {
      router.patch(
        projectPath(accountIndex, project.project_slug, '/invitations/link'),
        { role: linkRole },
        options,
      );

      return;
    }

    router.post(
      projectPath(accountIndex, project.project_slug, '/invitations/link'),
      { role: linkRole },
      options,
    );
  };

  const disableLink = () => {
    if (!canManage || !invitationLink) return;

    router.delete(
      projectPath(accountIndex, project.project_slug, '/invitations/link'),
      {
        preserveScroll: true,
      },
    );
  };

  const copyLink = async (value: string) => {
    await navigator.clipboard?.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  const changeMemberRole = (
    member: ProjectMember,
    role: AssignableProjectRole,
  ) => {
    router.patch(
      projectPath(accountIndex, project.project_slug, `/members/${member.id}`),
      { role },
      { preserveScroll: true },
    );
  };

  const removeMember = (member: ProjectMember) => {
    router.delete(
      projectPath(accountIndex, project.project_slug, `/members/${member.id}`),
      {
        preserveScroll: true,
      },
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Share project"
        className="flex max-h-[88dvh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-dark-border bg-dark-surface-2 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-dark-border px-5">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-dark-primary">
              Share {project.project_name}
            </h2>
            <p className="text-xs text-dark-secondary">
              {share.members.length} members
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-md text-dark-secondary transition-colors hover:bg-white/[0.07] hover:text-dark-primary"
          >
            <XIcon />
          </button>
        </div>

        <div className="scrollbar-app flex-1 overflow-y-auto p-5">
          <form onSubmit={submitInvitation} className="flex gap-2">
            <div className="min-w-0 flex-1">
              <input
                type="text"
                value={inviteForm.data.invitee}
                disabled={!canManage}
                onChange={(event) =>
                  inviteForm.setData('invitee', event.target.value)
                }
                placeholder="Email address or name"
                className="h-9 w-full rounded-md border border-dark-border bg-dark-input px-3 text-sm text-dark-primary outline-none placeholder:text-dark-secondary focus:border-dark-border-focus disabled:cursor-not-allowed disabled:opacity-50"
              />
              {inviteForm.errors.invitee && (
                <p className="mt-1 text-xs text-status-error">
                  {inviteForm.errors.invitee}
                </p>
              )}
            </div>
            <RoleSelect
              value={inviteForm.data.role}
              roles={roles}
              disabled={!canManage}
              onChange={(role) => inviteForm.setData('role', role)}
            />
            <button
              type="submit"
              disabled={!canManage || inviteForm.processing}
              className="h-9 rounded-md bg-dark-primary px-4 text-sm font-semibold text-dark-surface-1 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {inviteForm.processing ? 'Sharing' : 'Share'}
            </button>
          </form>

          <div className="mt-5 rounded-lg border border-dark-border bg-dark-surface-1 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-dark-surface-3 text-dark-primary">
                <LinkIcon />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-dark-primary">
                  Share this project with a link
                </p>
                {invitationLink ? (
                  <button
                    type="button"
                    onClick={() => copyLink(invitationLink.url)}
                    className="mt-1 max-w-full truncate text-left text-sm font-medium text-status-info hover:underline"
                  >
                    {copied ? 'Copied' : invitationLink.url}
                  </button>
                ) : (
                  <p className="mt-1 text-sm text-dark-secondary">
                    Link disabled
                  </p>
                )}
              </div>
              <RoleSelect
                value={linkRole}
                roles={roles}
                disabled={!canManage}
                onChange={setSelectedLinkRole}
              />
              <button
                type="button"
                onClick={saveLink}
                disabled={!canManage || linkProcessing}
                className="h-9 rounded-md border border-dark-border px-3 text-sm font-semibold text-dark-primary transition-colors hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {invitationLink ? 'Save' : 'Create'}
              </button>
              {invitationLink && (
                <button
                  type="button"
                  onClick={disableLink}
                  disabled={!canManage}
                  className="h-9 rounded-md border border-dark-border px-3 text-sm font-semibold text-dark-secondary transition-colors hover:bg-accent-red/15 hover:text-accent-red disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Disable
                </button>
              )}
            </div>
          </div>

          {share.pending_invitations.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-xs font-semibold text-dark-secondary uppercase">
                Pending invitations
              </p>
              <div className="space-y-1">
                {share.pending_invitations.map((invitation) => (
                  <button
                    key={invitation.id}
                    type="button"
                    onClick={() => copyLink(invitation.url)}
                    className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-white/[0.04]"
                  >
                    <span className="min-w-0 truncate text-sm text-dark-primary">
                      {invitation.email ?? invitation.name}
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-dark-secondary">
                      {ROLE_LABELS[invitation.role]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-5">
            <div className="mb-2 flex items-center gap-2 border-b border-dark-border pb-2">
              <p className="text-sm font-semibold text-status-info">
                Project members
              </p>
              <span className="rounded bg-dark-surface-3 px-2 py-0.5 text-xs font-semibold text-dark-secondary">
                {share.members.length}
              </span>
            </div>

            <div className="space-y-1">
              {share.members.map((member) => (
                <MemberRow
                  key={member.id}
                  member={member}
                  roles={roles}
                  canManage={canManage}
                  onRoleChange={changeMemberRole}
                  onRemove={removeMember}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectInvitationModal;
