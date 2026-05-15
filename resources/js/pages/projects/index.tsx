import { Head, Link, router, usePage } from '@inertiajs/react';
import Zeno from '@public/logos/logo.svg';
import { useState } from 'react';
import CreateProjectPanel from '@/components/projects/CreateProjectPanel';
import type { Auth, PaginatedProjects, ProjectSummary } from '@/types';

interface ProjectsPageProps {
  auth: Auth;
  recentProjects: ProjectSummary[];
  projects: PaginatedProjects;
  [key: string]: unknown;
}

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={filled ? 'text-accent-yellow' : 'text-dark-secondary'}
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-dark-secondary">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const ChevronIcon = ({ dir }: { dir: 'left' | 'right' }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    {dir === 'left' ? <polyline points="15 18 9 12 15 6" /> : <polyline points="9 18 15 12 9 6" />}
  </svg>
);

const ChevronDown = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const getInitials = (name: string) =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

interface ProjectRowProps {
  project: ProjectSummary;
  onPin: (slug: string, current: boolean) => void;
  showPin?: boolean;
}

const ProjectRow = ({ project, onPin, showPin = true }: ProjectRowProps) => (
  <Link
    href={`/p/${project.project_slug}`}
    className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-white/[0.04]"
  >
    <div className="min-w-0">
      <p className="truncate text-sm font-medium text-dark-primary">{project.project_name}</p>
      <p className="truncate text-xs text-dark-secondary">{project.project_slug}</p>
    </div>
    {showPin && (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onPin(project.project_slug, project.is_pinned);
        }}
        className="ml-3 shrink-0 rounded p-1 transition-colors hover:bg-white/[0.07]"
        aria-label={project.is_pinned ? 'Unpin project' : 'Pin project'}
      >
        <StarIcon filled={project.is_pinned} />
      </button>
    )}
  </Link>
);

const ProjectsPage = () => {
  const { auth, recentProjects, projects } = usePage<ProjectsPageProps>().props;
  const [panelOpen, setPanelOpen] = useState(false);
  const [search, setSearch] = useState('');

  const hasProjects = projects.total > 0;
  const pageTitle = hasProjects ? 'All Projects' : 'Get Started';

  const handlePin = (slug: string, current: boolean) => {
    router.patch(`/p/${slug}/pin`, {}, {
      preserveScroll: true,
      onSuccess: () => router.reload({ only: ['projects', 'recentProjects'] }),
    });
  };

  const filteredProjects = search.trim()
    ? projects.data.filter(
        (p) =>
          p.project_name.toLowerCase().includes(search.toLowerCase()) ||
          p.project_slug.toLowerCase().includes(search.toLowerCase()),
      )
    : projects.data;

  const canGoPrev = projects.current_page > 1;
  const canGoNext = projects.current_page < projects.last_page;

  const goToPage = (page: number) => {
    router.get('/projects', { page }, { preserveScroll: true, replace: true });
  };

  return (
    <>
      <Head title={pageTitle} />

      <div className="flex h-dvh flex-col bg-dark-surface-1 select-none">
        {/* Top bar */}
        <div className="flex h-12 shrink-0 items-center justify-between px-6">
          <span className="text-sm font-semibold text-dark-primary">{pageTitle}</span>
          <button className="flex items-center gap-2 rounded-md px-2 py-1 text-sm font-medium text-dark-primary transition-colors hover:bg-white/[0.07]">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-dark-surface-3 text-[10px] font-semibold text-dark-primary">
              {getInitials(auth.user?.name ?? 'U')}
            </div>
            <span>{auth.user?.name}</span>
            <ChevronDown />
          </button>
        </div>

        {/* Main content */}
        <div className="flex flex-1 gap-4 overflow-hidden px-6 pb-6">
          {/* Left panel */}
          <div className="flex w-[360px] shrink-0 flex-col gap-4">
            {/* Create project card */}
            <button
              type="button"
              onClick={() => setPanelOpen(true)}
              className="flex w-full items-start gap-3 rounded-xl bg-dark-surface-2 p-4 text-left transition-colors hover:bg-dark-surface-3"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-dark-surface-1">
                <Zeno />
              </div>
              <div>
                <p className="text-sm font-semibold text-dark-primary">Create your Project roadmap.</p>
                <p className="mt-0.5 text-xs text-dark-secondary">
                  Define tasks, assign team members, and track progress.
                </p>
              </div>
            </button>

            {/* Recently Opened */}
            <div className="flex flex-1 flex-col overflow-hidden rounded-xl bg-dark-surface-2 p-4">
              <h2 className="mb-3 text-sm font-semibold text-dark-primary">Recently Opened</h2>
              {recentProjects.length === 0 ? (
                <div className="flex flex-1 items-center justify-center">
                  <p className="text-center text-sm font-medium text-dark-secondary">
                    You Don't Have A Project Yet.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-0.5">
                  {recentProjects.map((project) => (
                    <ProjectRow key={project.project_id} project={project} onPin={handlePin} showPin={false} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right panel */}
          <div className="flex flex-1 flex-col overflow-hidden rounded-xl bg-dark-surface-2 p-4">
            {/* Search */}
            <div className="relative mb-4">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                <SearchIcon />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search all projects"
                className="h-9 w-full rounded-lg border border-dark-border bg-dark-input pl-9 pr-3 text-sm text-dark-primary outline-none placeholder:text-dark-secondary focus:border-dark-border-focus focus:bg-dark-input-focus"
              />
            </div>

            {/* Project list */}
            <div className="flex flex-1 flex-col overflow-hidden">
              {filteredProjects.length === 0 ? (
                <div className="flex flex-1 items-center justify-center">
                  <p className="text-sm font-medium text-dark-secondary">
                    {search ? 'No projects match your search.' : "You Don't Have A Project Yet."}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-0.5">
                  {filteredProjects.map((project) => (
                    <ProjectRow key={project.project_id} project={project} onPin={handlePin} />
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            {!search && projects.total > 0 && (
              <div className="mt-auto flex items-center justify-end gap-2 pt-3">
                <span className="text-xs text-dark-secondary">
                  {projects.from ?? 0} - {projects.current_page} of {projects.last_page}
                </span>
                <button
                  type="button"
                  onClick={() => canGoPrev && goToPage(projects.current_page - 1)}
                  disabled={!canGoPrev}
                  className="flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-white/[0.07] disabled:opacity-30"
                >
                  <ChevronIcon dir="left" />
                </button>
                <button
                  type="button"
                  onClick={() => canGoNext && goToPage(projects.current_page + 1)}
                  disabled={!canGoNext}
                  className="flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-white/[0.07] disabled:opacity-30"
                >
                  <ChevronIcon dir="right" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <CreateProjectPanel open={panelOpen} onClose={() => setPanelOpen(false)} />
    </>
  );
};

export default ProjectsPage;
