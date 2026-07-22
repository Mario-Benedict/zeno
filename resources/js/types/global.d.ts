import type { Auth } from '@/types/auth';
import type {
  CurrentProject,
  ProjectNavigation,
  ProjectRole,
  ProjectShare,
} from '@/types/project';
import type { GlobalSearchPayload } from '@/types/search';

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
      account: {
        index: number;
        baseUrl: string;
      };

      /** All signed-in accounts for the multi-account switcher. */
      accountsList: Array<{
        index: number;
        name: string;
        email: string;
        avatar: string | null;
        is_active: boolean;
      }>;

      /** Current project context. `null` outside of `/u/{accountIndex}/p/{slug}/...` routes. */
      project: CurrentProject | null;

      /** Authenticated user's role on the current project. `null` outside a project context. */
      projectRole: ProjectRole | null;
      projectNavigation: ProjectNavigation;
      projectShare: ProjectShare | null;
      globalSearch: GlobalSearchPayload;

      twoFactor: { enabled: boolean; qrCodeUrl: string | null };

      sidebarOpen: boolean;
      [key: string]: unknown;
    };
  }
}
