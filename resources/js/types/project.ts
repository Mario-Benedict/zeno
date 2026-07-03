export type ProjectRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
export type AssignableProjectRole = Exclude<ProjectRole, 'OWNER'>;

/**
 * Minimal project shape shared globally by Inertia whenever the current
 * route is scoped to a project (e.g. `/u/{accountIndex}/p/{slug}/...`). Always available as
 * `usePage().props.project` — no manual page-props interface required.
 */
export type CurrentProject = {
  project_id: string;
  project_name: string;
  project_slug: string;
  avatar_color: string;
  avatar_url: string | null;
};

/**
 * Project + the current user's per-project metadata. Used by the projects
 * listing (`/u/{accountIndex}/projects`) where we surface `is_pinned` and `role`.
 */
export type Project = CurrentProject & {
  is_pinned: boolean;
  role: ProjectRole;
};

export type ProjectSummary = Pick<
  Project,
  | 'project_id'
  | 'project_name'
  | 'project_slug'
  | 'avatar_color'
  | 'avatar_url'
  | 'is_pinned'
  | 'role'
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

export type ProjectMember = {
  id: number;
  name: string;
  email: string;
  role: ProjectRole;
  is_current_user: boolean;
};

export type PendingProjectInvitation = {
  id: string;
  email: string | null;
  name: string | null;
  role: AssignableProjectRole;
  url: string;
  expires_at: string | null;
};

export type ProjectInvitationLink = {
  url: string;
  role: AssignableProjectRole;
};

export type ProjectShare = {
  can_manage_members: boolean;
  assignable_roles: AssignableProjectRole[];
  invitation_link: ProjectInvitationLink | null;
  members: ProjectMember[];
  pending_invitations: PendingProjectInvitation[];
};

export type ProjectNavigation = {
  projects: ProjectSummary[];
};
