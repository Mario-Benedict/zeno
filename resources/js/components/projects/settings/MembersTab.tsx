import { router } from '@inertiajs/react';
import { useTranslation } from '@/hooks/useTranslation';
import { projectPath } from '@/lib/accountRoutes';
import type {
  AssignableProjectRole,
  CurrentProject,
  ProjectMember,
  ProjectShare,
} from '@/types';
import { RoleSelect, getInitials } from './shared';

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

const MembersTab = ({
  share,
  project,
  accountIndex,
}: {
  share: ProjectShare | null;
  project: CurrentProject;
  accountIndex: number;
}) => {
  const { t } = useTranslation();
  const canManage = share?.can_manage_members ?? false;
  const roles =
    share?.assignable_roles ??
    (['ADMIN', 'MEMBER', 'VIEWER'] as AssignableProjectRole[]);
  const members: ProjectMember[] = share?.members ?? [];

  const changeRole = (member: ProjectMember, role: AssignableProjectRole) => {
    router.patch(
      projectPath(accountIndex, project.project_slug, `/members/${member.id}`),
      { role },
      { preserveScroll: true },
    );
  };

  const removeMember = (member: ProjectMember) => {
    router.delete(
      projectPath(accountIndex, project.project_slug, `/members/${member.id}`),
      { preserveScroll: true },
    );
  };

  return (
    <div>
      <div className="mb-5 flex items-center gap-2.5">
        <h3 className="text-normal font-semibold text-dark-primary">
          {t('projectSettingsTabs.members')}
        </h3>
        <span className="rounded-md bg-dark-surface-3 px-2 py-0.5 text-xsmall font-semibold text-dark-secondary">
          {members.length}
        </span>
      </div>

      {members.length === 0 ? (
        <p className="text-small text-dark-secondary">
          {t('projectSettingsTabs.noMembersYet')}
        </p>
      ) : (
        <div className="space-y-0.5">
          {members.map((member) => {
            const isOwner = member.role === 'OWNER';
            const canEdit = canManage && !isOwner && !member.is_current_user;

            return (
              <div
                key={member.id}
                className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-white/[0.04]"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-blue text-xsmall font-bold text-white">
                  {getInitials(member.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-small font-semibold text-dark-primary">
                    {member.name}
                    {member.is_current_user && (
                      <span className="ml-1.5 font-normal text-dark-secondary">
                        ({t('projectSettingsTabs.you')})
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xsmall text-dark-secondary">
                    {member.email}
                  </p>
                </div>
                {isOwner ? (
                  <span className="rounded-md border border-dark-border px-2.5 py-1.5 text-xsmall font-medium text-dark-secondary">
                    {t('common.owner')}
                  </span>
                ) : (
                  <RoleSelect
                    value={member.role as AssignableProjectRole}
                    roles={roles}
                    disabled={!canEdit}
                    onChange={(role) => changeRole(member, role)}
                  />
                )}
                {canEdit && (
                  <button
                    type="button"
                    aria-label={t('projectSettingsTabs.removeMember', {
                      name: member.name,
                    })}
                    onClick={() => removeMember(member)}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-dark-secondary transition-colors hover:bg-accent-red/15 hover:text-accent-red"
                  >
                    <TrashIcon />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-5 rounded-lg border border-dark-border bg-dark-surface-1 px-4 py-3 text-small text-dark-secondary">
        {t('projectSettingsTabs.inviteMembersHint', {
          people: t('projectSettingsTabs.peopleIcon'),
        })}
      </div>
    </div>
  );
};

export default MembersTab;
