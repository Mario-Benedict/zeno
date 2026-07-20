import ProjectRoleSelect from '@/components/projects/ProjectRoleSelect';
import { useTranslation } from '@/hooks/useTranslation';
import type { AssignableProjectRole, ProjectMember } from '@/types';
import TrashIcon from '@public/icons/small/trash.svg';

interface ProjectMemberRowProps {
  member: ProjectMember;
  roles: AssignableProjectRole[];
  canManage: boolean;
  onRoleChange: (member: ProjectMember, role: AssignableProjectRole) => void;
  onRemove: (member: ProjectMember) => void;
}

const getInitials = (name: string): string =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

const ProjectMemberRow = ({
  member,
  roles,
  canManage,
  onRoleChange,
  onRemove,
}: ProjectMemberRowProps) => {
  const { t } = useTranslation();
  const canEdit =
    canManage && member.role !== 'OWNER' && !member.is_current_user;

  return (
    <div className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-white/[0.04]">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-blue text-xsmall font-bold text-white">
        {getInitials(member.name)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-small font-semibold text-dark-primary">
          {member.name}
          {member.is_current_user ? ` (${t('projectSettingsTabs.you')})` : ''}
        </p>
        <p className="truncate text-xsmall text-dark-secondary">
          {member.email}
        </p>
      </div>
      {member.role === 'OWNER' ? (
        <span className="rounded-md border border-dark-border px-3 py-2 text-small font-medium text-dark-secondary">
          {t('common.owner')}
        </span>
      ) : (
        <ProjectRoleSelect
          value={member.role}
          roles={roles}
          disabled={!canEdit}
          onChange={(role) => onRoleChange(member, role)}
        />
      )}
      {canEdit && (
        <button
          type="button"
          aria-label={t('projectSettingsTabs.removeMember', {
            name: member.name,
          })}
          onClick={() => onRemove(member)}
          className="flex h-9 w-9 items-center justify-center rounded-md text-dark-secondary transition-colors hover:bg-accent-red/15 hover:text-accent-red"
        >
          <TrashIcon />
        </button>
      )}
    </div>
  );
};

export default ProjectMemberRow;
