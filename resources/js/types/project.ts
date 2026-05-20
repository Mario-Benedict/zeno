export type ProjectRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

export type Project = {
  project_id: string;
  project_name: string;
  project_slug: string;
  is_pinned: boolean;
  role: ProjectRole;
};

export type ProjectSummary = Pick<Project, 'project_id' | 'project_name' | 'project_slug' | 'is_pinned' | 'role'>;

export type PaginatedProjects = {
  data: ProjectSummary[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
};
