import { router } from '@inertiajs/react';
import { useState } from 'react';
import ConfirmModal from '@/components/shared/ConfirmModal';
import { useTranslation } from '@/hooks/useTranslation';
import { projectPath } from '@/lib/accountRoutes';
import { inertiaJson } from '@/lib/inertiaJson';
import projects from '@/routes/projects';
import type {
  AssignableProjectRole,
  CurrentProject,
  ProjectMember,
  ProjectShare,
} from '@/types';
import TrashIcon from '@public/icons/small/trash.svg';
import RoleSelect from './RoleSelect';
import { getInitials } from './shared';

interface AssignedTasksResponse {
  count: number;
  cards: { id: string; title: string }[];
}

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

  const [pendingRemoval, setPendingRemoval] = useState<ProjectMember | null>(
    null,
  );
  const [assignedTasks, setAssignedTasks] =
    useState<AssignedTasksResponse | null>(null);
  const [checkingTasks, setCheckingTasks] = useState(false);

  const changeRole = (member: ProjectMember, role: AssignableProjectRole) => {
    router.patch(
      projectPath(accountIndex, project.project_slug, `/members/${member.id}`),
      { role },
      { preserveScroll: true },
    );
  };

  const startRemoval = async (member: ProjectMember) => {
    setPendingRemoval(member);
    setAssignedTasks(null);
    setCheckingTasks(true);
    try {
      const data = await inertiaJson<AssignedTasksResponse>(
        'get',
        projects.members.assignedTasks.url({
          accountIndex,
          project: project.project_slug,
          user: member.id,
        }),
      );
      setAssignedTasks(data);
    } catch (error) {
      console.error('Failed to check assigned tasks', error);
      // Fail open with a zero count rather than blocking removal entirely —
      // the worst case is the admin doesn't see the task warning.
      setAssignedTasks({ count: 0, cards: [] });
    } finally {
      setCheckingTasks(false);
    }
  };

  const confirmRemoval = () => {
    if (!pendingRemoval) return;
    router.delete(
      projectPath(
        accountIndex,
        project.project_slug,
        `/members/${pendingRemoval.id}`,
      ),
      { preserveScroll: true },
    );
    setPendingRemoval(null);
    setAssignedTasks(null);
  };

  const cancelRemoval = () => {
    setPendingRemoval(null);
    setAssignedTasks(null);
  };

  const hasAssignedTasks = (assignedTasks?.count ?? 0) > 0;

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
                  <span className="flex h-8 w-28 items-center justify-center rounded-md border border-dark-border text-xsmall font-medium whitespace-nowrap text-dark-secondary">
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
                    onClick={() => void startRemoval(member)}
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

      {pendingRemoval && !checkingTasks && (
        <ConfirmModal
          title={t('projectSettingsTabs.removeMemberConfirmTitle', {
            name: pendingRemoval.name,
          })}
          description={
            hasAssignedTasks
              ? t('projectSettingsTabs.removeMemberAssignedTasksDescription', {
                  name: pendingRemoval.name,
                  count: assignedTasks?.count ?? 0,
                })
              : t('projectSettingsTabs.removeMemberConfirmDescription', {
                  name: pendingRemoval.name,
                })
          }
          confirmLabel={
            hasAssignedTasks
              ? t('projectSettingsTabs.removeMemberAssignedTasksConfirm')
              : t('projectSettingsTabs.removeMember', {
                  name: pendingRemoval.name,
                })
          }
          cancelLabel={t('common.cancel')}
          tone="danger"
          onConfirm={confirmRemoval}
          onCancel={cancelRemoval}
        />
      )}
    </div>
  );
};

export default MembersTab;
