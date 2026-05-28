import { usePage } from '@inertiajs/react';
import type { CurrentProject, ProjectRole } from '@/types/project';

/**
 * Read the current project context from Inertia's shared page props.
 *
 * The project + role are auto-shared by `HandleInertiaRequests` whenever the
 * route is scoped to a project (`/p/{slug}/...`). This hook is a typed
 * convenience around `usePage().props.project` so pages don't have to
 * declare their own props interface — just call:
 *
 *     const { project, projectRole } = useProject();
 *
 * If you call this outside of a project-scoped route it will throw, since
 * pages that depend on a project should never render without one.
 */
export const useProject = (): { project: CurrentProject; projectRole: ProjectRole | null } => {
  const { project, projectRole } = usePage().props;

  if (project === null) {
    throw new Error(
      'useProject() was called on a page without a project context. ' +
        'Make sure the route is under `/p/{slug}/...`.',
    );
  }

  return { project, projectRole };
};

/**
 * Same as `useProject` but returns `null` instead of throwing — useful for
 * shared layouts/components that may render both inside and outside a
 * project context (e.g. the global header).
 */
export const useOptionalProject = (): { project: CurrentProject | null; projectRole: ProjectRole | null } => {
  const { project, projectRole } = usePage().props;

  return { project, projectRole };
};
