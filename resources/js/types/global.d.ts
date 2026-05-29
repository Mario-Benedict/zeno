import type { Auth } from '@/types/auth';
import type { CurrentProject, ProjectRole } from '@/types/project';

/**
 * Augment Inertia's `sharedPageProps` so every page automatically gets
 * type-safe access to data we share from `HandleInertiaRequests::share()`.
 *
 * Anything declared here is available everywhere via:
 *
 *     const { auth, project, projectRole } = usePage().props;
 *
 * — no per-page interface needed.
 */
declare module '@inertiajs/core' {
  export interface InertiaConfig {
    sharedPageProps: {
      name: string;
      auth: Auth;

      /** Current project context. `null` outside of `/p/{slug}/...` routes. */
      project: CurrentProject | null;

      /** Authenticated user's role on the current project. `null` outside a project context. */
      projectRole: ProjectRole | null;

      sidebarOpen: boolean;
      [key: string]: unknown;
    };
  }
}
