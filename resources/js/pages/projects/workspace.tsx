import { useProject } from '@/hooks/useProject';
import AppLayout from '@/layouts/AppLayout';

// No `WorkspaceProps` interface needed — `project` and `projectRole` come from
// Inertia's shared page props (see `HandleInertiaRequests::share()` +
// `types/global.d.ts`) and are auto-typed for every project-scoped page.
const Workspace = () => {
  const { project, projectRole } = useProject();

  return (
    <AppLayout>
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
        <h1 className="text-xl font-semibold text-dark-primary">
          {project.project_name}
        </h1>
        <p className="text-sm text-dark-secondary">
          {project.project_slug} · {projectRole}
        </p>
      </div>
    </AppLayout>
  );
};

export default Workspace;
