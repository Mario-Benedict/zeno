import { Link } from '@inertiajs/react';
import { PinButton } from '@/components/shared/PinButton';
import { projectPath } from '@/lib/accountRoutes';
import type { ProjectSummary } from '@/types';

interface Props {
  project: ProjectSummary;
  accountIndex: number;
  onPin: (slug: string, current: boolean) => void;
  pinning?: boolean;
  showPin?: boolean;
}

const ProjectListRow = ({
  project,
  accountIndex,
  onPin,
  pinning = false,
  showPin = true,
}: Props) => (
  <Link
    href={projectPath(accountIndex, project.project_slug)}
    className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-dark-surface-3"
  >
    <div className="min-w-0">
      <p className="truncate text-sm font-medium text-dark-primary">
        {project.project_name}
      </p>
      <p className="truncate text-xs text-dark-secondary">
        {project.project_slug}
      </p>
    </div>
    {showPin && (
      <PinButton
        pinned={project.is_pinned}
        onToggle={() => onPin(project.project_slug, project.is_pinned)}
        disabled={pinning}
        className="ml-3"
      />
    )}
  </Link>
);

export default ProjectListRow;
