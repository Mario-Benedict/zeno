import { Link, usePage } from '@inertiajs/react';
import { accountPath, projectPath } from '@/lib/accountRoutes';
import type { CurrentProject, ProjectSummary } from '@/types';

interface ProjectSwitcherProps {
  open: boolean;
  currentProject: CurrentProject | null;
  projects: ProjectSummary[];
  onClose: () => void;
}

const ProjectIcon = ({ name }: { name: string }) => (
  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-dark-surface-3 text-sm font-bold text-dark-primary">
    {name.slice(0, 1).toUpperCase()}
  </div>
);

const ProjectSwitcher = ({
  open,
  currentProject,
  projects,
  onClose,
}: ProjectSwitcherProps) => {
  const { account } = usePage().props;
  const accountIndex = account.index;

  if (!open) return null;

  return (
    <div className="absolute top-10 left-0 z-40 w-88 overflow-hidden rounded-lg border-2 border-dark-surface-3 bg-dark-surface-1 p-2 shadow-2xl">
      {/* <div className="px-2 py-1">
        <p className="text-small font-black text-dark-primary">
          Current Project
        </p>
      </div> */}

      {currentProject && (
        <div
          // href={projectPath(accountIndex, currentProject.project_slug)}
          // onClick={onClose}
          className="flex items-center gap-3 rounded-lg bg-dark-surface-1 px-2 py-2"
        >
          <ProjectIcon name={currentProject.project_name} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-dark-primary">
              {currentProject.project_name}
            </p>
            <p className="truncate text-xs text-dark-secondary">
              {currentProject.project_slug}
            </p>
          </div>
        </div>
      )}

      {projects.length > 0 && (
        <>
          <div className="my-2 h-px bg-dark-border" />
          <p className="px-2 py-1 text-xsmall font-semibold tracking-wide text-dark-primary uppercase">
            Your projects
          </p>
          <div className="scrollbar-app max-h-64 space-y-0.5 overflow-y-auto pr-1">
            {projects.map((project) => (
              <Link
                key={project.project_id}
                href={projectPath(accountIndex, project.project_slug)}
                onClick={onClose}
                className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-white/[0.07]"
              >
                <ProjectIcon name={project.project_name} />
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
          className="block rounded-md px-2 py-2 text-sm font-semibold text-dark-primary transition-colors hover:bg-dark-surface-2"
        >
          See all projects
        </Link>
        <Link
          href={accountPath(accountIndex, '/projects?create=1')}
          onClick={onClose}
          className="block rounded-md px-2 py-2 text-sm font-semibold text-dark-primary transition-colors hover:bg-dark-surface-2"
        >
          Create a project
        </Link>
      </div>
    </div>
  );
};

export default ProjectSwitcher;
