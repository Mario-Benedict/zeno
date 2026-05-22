import { usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import type { Auth, ProjectRole } from '@/types';

interface WorkspaceProps {
  auth: Auth;
  project: {
    project_id: string;
    project_name: string;
    project_slug: string;
  };
  role: ProjectRole;
  [key: string]: unknown;
}

const Workspace = () => {
  const { project, role } = usePage<WorkspaceProps>().props;

  console.log(project, role);

  return (
    <AppLayout>
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
        <h1 className="text-xl font-semibold text-dark-primary">{project.project_name}</h1>
        <p className="text-sm text-dark-secondary">
          {project.project_slug} · {role}
        </p>
      </div>
    </AppLayout>
  );
};

export default Workspace;
