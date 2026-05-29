export type ProjectRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

/**
 * Minimal project shape shared globally by Inertia whenever the current
 * route is scoped to a project (e.g. `/p/{slug}/...`). Always available as
 * `usePage().props.project` — no manual page-props interface required.
 */
export type CurrentProject = {
  project_id: string;
  project_name: string;
  project_slug: string;
};

/**
 * Project + the current user's per-project metadata. Used by the projects
 * listing (`/projects`) where we surface `is_pinned` and `role`.
 */
export type Project = CurrentProject & {
  is_pinned: boolean;
  role: ProjectRole;
};

export type ProjectSummary = Pick<
  Project,
  'project_id' | 'project_name' | 'project_slug' | 'is_pinned' | 'role'
>;

export type PaginatedProjects = {
  data: ProjectSummary[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
};
