import { Link, usePage } from '@inertiajs/react';
import { accountPath, projectPath } from '@/lib/accountRoutes';
import { avatarHex } from '@/lib/projectAvatar';
import type { CurrentProject, ProjectSummary } from '@/types';

interface ProjectSwitcherProps {
  open: boolean;
  currentProject: CurrentProject | null;
  projects: ProjectSummary[];
  onClose: () => void;
  onSettingsOpen: () => void;
}

const ProjectIcon = ({
  name,
  color,
  avatarUrl,
}: {
  name: string;
  color: string;
  avatarUrl: string | null;
}) => {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className="h-9 w-9 shrink-0 rounded-md object-cover"
      />
    );
  }
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-xsmall font-bold text-white"
      style={{ backgroundColor: avatarHex(color) }}
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
};

const ProjectSwitcher = ({
  open,
  currentProject,
  projects,
  onClose,
  onSettingsOpen,
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
          className="flex items-center gap-3 rounded-lg bg-dark-surface-1 px-2 py-2"
        >
          <ProjectIcon name={currentProject.project_name} color={currentProject.avatar_color} avatarUrl={currentProject.avatar_url} />
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
                <ProjectIcon name={project.project_name} color={project.avatar_color} avatarUrl={project.avatar_url} />
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
          See all projects
        </Link>
        <Link
          href={accountPath(accountIndex, '/projects?create=1')}
          onClick={onClose}
          className="block rounded-md px-2 py-2 text-small font-semibold text-dark-primary transition-colors hover:bg-dark-surface-2"
        >
          Create a project
        </Link>
        {currentProject && (
          <button
            type="button"
            onClick={() => {
              onClose();
              onSettingsOpen();
            }}
            className="block w-full rounded-md px-2 py-2 text-left text-small font-semibold text-dark-secondary transition-colors hover:bg-dark-surface-2 hover:text-dark-primary"
          >
            Project settings
          </button>
        )}
      </div>
    </div>
  );
};

export default ProjectSwitcher;
