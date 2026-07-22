import { Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { accountPath, projectPath } from '@/lib/accountRoutes';
import { inertiaJson } from '@/lib/inertiaJson';
import projectRoutes from '@/routes/projects';
import type { CurrentProject, ProjectSummary } from '@/types';
import ProjectSwitcherIcon from './ProjectSwitcherIcon';

interface ProjectSwitcherProps {
  open: boolean;
  currentProject: CurrentProject | null;
  projects: ProjectSummary[];
  onClose: () => void;
}

const ProjectSwitcher = ({
  open,
  currentProject,
  projects,
  onClose,
}: ProjectSwitcherProps) => {
  const { account } = usePage().props;
  const { t } = useTranslation();
  const accountIndex = account.index;
  const [notified, setNotified] = useState<Record<string, boolean>>({});
  const projectIdsKey = projects.map((p) => p.project_id).join(',');

  // Fetched on-demand only when the switcher actually opens — this spans
  // every project the user's in, so it isn't cheap enough to eagerly share
  // on every page load like the rest of the switcher's data.
  useEffect(() => {
    if (!open || projectIdsKey === '') return;

    let cancelled = false;
    inertiaJson<Record<string, boolean>>(
      'get',
      projectRoutes.notificationStatus.url(
        { accountIndex },
        { query: { project_ids: projectIdsKey.split(',') } },
      ),
    )
      .then((data) => {
        if (!cancelled) setNotified(data);
      })
      .catch((err: unknown) =>
        console.error('Failed to load project notification status', err),
      );

    return () => {
      cancelled = true;
    };
  }, [open, projectIdsKey, accountIndex]);

  if (!open) return null;

  return (
    <div className="absolute top-10 left-0 z-40 w-88 overflow-hidden rounded-lg border-2 border-dark-surface-3 bg-dark-surface-1 p-2 shadow-2xl">
      {/* <div className="px-2 py-1">
        <p className="text-small font-black text-dark-primary">
          Current Project
        </p>
      </div> */}

      {currentProject && (
        <div className="flex items-center gap-3 rounded-lg bg-dark-surface-1 px-2 py-2">
          <ProjectSwitcherIcon
            name={currentProject.project_name}
            color={currentProject.avatar_color}
            avatarUrl={currentProject.avatar_url}
          />
          <div className="min-w-0">
            <p className="truncate text-small font-semibold text-dark-primary">
              {currentProject.project_name}
            </p>
            <p className="truncate text-xsmall text-dark-secondary">
              {currentProject.project_slug}
            </p>
          </div>
        </div>
      )}

      {projects.length > 0 && (
        <>
          <div className="my-2 h-px bg-dark-border" />
          <p className="px-2 py-1 text-xsmall font-semibold tracking-wide text-dark-primary uppercase">
            {t('header.yourProjects')}
          </p>
          <div className="scrollbar-app max-h-64 space-y-0.5 overflow-y-auto pr-1">
            {projects.map((project) => (
              <Link
                key={project.project_id}
                href={projectPath(accountIndex, project.project_slug)}
                onClick={onClose}
                className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-white/[0.07]"
              >
                <div className="relative shrink-0">
                  <ProjectSwitcherIcon
                    name={project.project_name}
                    color={project.avatar_color}
                    avatarUrl={project.avatar_url}
                  />
                  {notified[project.project_id] && (
                    <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-dark-surface-1 bg-accent-red" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-small font-medium text-dark-primary">
                    {project.project_name}
                  </p>
                  <p className="truncate text-xsmall font-semibold text-dark-secondary">
                    {project.role}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      <div className="my-2 h-px bg-dark-border" />

      <div className="space-y-0.5">
        <Link
          href={accountPath(accountIndex, '/projects')}
          onClick={onClose}
          className="block rounded-md px-2 py-2 text-small font-semibold text-dark-primary transition-colors hover:bg-dark-surface-2"
        >
          {t('header.seeAllProjects')}
        </Link>
        <Link
          href={accountPath(accountIndex, '/projects?create=1')}
          onClick={onClose}
          className="block rounded-md px-2 py-2 text-small font-semibold text-dark-primary transition-colors hover:bg-dark-surface-2"
        >
          {t('header.createAProject')}
        </Link>
      </div>
    </div>
  );
};

export default ProjectSwitcher;
