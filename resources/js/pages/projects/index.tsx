import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import AccountSwitcher from '@/components/layouts/AccountSwitcher';
import CreateProjectPanel from '@/components/projects/CreateProjectPanel';
import { accountPath, projectPath } from '@/lib/accountRoutes';
import type { PaginatedProjects, ProjectSummary } from '@/types';
import Zeno from '@public/logos/logo.svg';

interface ProjectsPageProps {
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
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-dark-secondary"
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const ChevronIcon = ({ dir }: { dir: 'left' | 'right' }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {dir === 'left' ? (
      <polyline points="15 18 9 12 15 6" />
    ) : (
      <polyline points="9 18 15 12 9 6" />
    )}
  </svg>
);

interface ProjectRowProps {
  project: ProjectSummary;
  accountIndex: number;
  onPin: (slug: string, current: boolean) => void;
  pinning?: boolean;
  showPin?: boolean;
}

const ProjectRow = ({
  project,
  accountIndex,
  onPin,
  pinning = false,
  showPin = true,
}: ProjectRowProps) => (
  <Link
    href={projectPath(accountIndex, project.project_slug)}
    className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-white/4"
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
      <button
        type="button"
        disabled={pinning}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onPin(project.project_slug, project.is_pinned);
        }}
        className="ml-3 shrink-0 rounded p-1 transition-colors hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-70"
        aria-label={project.is_pinned ? 'Unpin project' : 'Pin project'}
      >
        <StarIcon filled={project.is_pinned} />
      </button>
    )}
  </Link>
);

const sortProjects = (items: ProjectSummary[]) => {
  return [...items].sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;

    return a.project_name.localeCompare(b.project_name);
  });
};

const ProjectsPage = () => {
  const page = usePage<ProjectsPageProps>();
  const { recentProjects, projects, account } = page.props;
  const accountIndex = account.index;
  const [panelOpen, setPanelOpen] = useState(
    () =>
      new URLSearchParams(page.url.split('?')[1] ?? '').get('create') === '1',
  );
  const [search, setSearch] = useState('');
  const [pinOverrides, setPinOverrides] = useState<Record<string, boolean>>({});
  const [pinningSlugs, setPinningSlugs] = useState<Record<string, boolean>>({});

  const hasProjects = projects.total > 0;
  const pageTitle = hasProjects ? 'All Projects' : 'Get Started';

  const clearPinState = (slug: string) => {
    setPinOverrides((current) => {
      const next = { ...current };
      delete next[slug];

      return next;
    });

    setPinningSlugs((current) => {
      const next = { ...current };
      delete next[slug];

      return next;
    });
  };

  const handlePin = (slug: string, current: boolean) => {
    setPinOverrides((state) => ({ ...state, [slug]: !current }));
    setPinningSlugs((state) => ({ ...state, [slug]: true }));

    router.patch(
      projectPath(accountIndex, slug, '/pin'),
      {},
      {
        preserveScroll: true,
        onCancel: () => clearPinState(slug),
        onError: () => clearPinState(slug),
        onSuccess: () => clearPinState(slug),
      },
    );
  };

  const projectsWithPinState = projects.data.map((project) => ({
    ...project,
    is_pinned: pinOverrides[project.project_slug] ?? project.is_pinned,
  }));

  const filteredProjects = search.trim()
    ? projectsWithPinState.filter(
        (p) =>
          p.project_name.toLowerCase().includes(search.toLowerCase()) ||
          p.project_slug.toLowerCase().includes(search.toLowerCase()),
      )
    : sortProjects(projectsWithPinState);

  const canGoPrev = projects.current_page > 1;
  const canGoNext = projects.current_page < projects.last_page;

  const goToPage = (page: number) => {
    router.get(
      accountPath(accountIndex, '/projects'),
      { page },
      { preserveScroll: true, replace: true },
    );
  };

  const closePanel = () => {
    setPanelOpen(false);

    if (
      new URLSearchParams(page.url.split('?')[1] ?? '').get('create') === '1'
    ) {
      router.get(
        accountPath(accountIndex, '/projects'),
        {},
        { preserveScroll: true, preserveState: true, replace: true },
      );
    }
  };

  return (
    <>
      <Head title={pageTitle} />

      <div className="flex h-dvh flex-col bg-dark-surface-1 select-none">
        {/* Top bar */}
        <div className="flex h-12 shrink-0 items-center justify-between px-6">
          <span className="text-sm font-semibold text-dark-primary">
            {pageTitle}
          </span>
          <AccountSwitcher />
        </div>

        {/* Main content */}
        <div className="flex flex-1 gap-4 overflow-hidden px-6 pb-6">
          {/* Left panel */}
          <div className="flex w-90 shrink-0 flex-col gap-4">
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
                <p className="text-sm font-semibold text-dark-primary">
                  Create your Project roadmap.
                </p>
                <p className="mt-0.5 text-xs text-dark-secondary">
                  Define tasks, assign team members, and track progress.
                </p>
              </div>
            </button>

            {/* Recently Opened */}
            <div className="flex flex-1 flex-col overflow-hidden rounded-xl bg-dark-surface-2 p-4">
              <h2 className="mb-3 text-sm font-semibold text-dark-primary">
                Recently Opened
              </h2>
              {recentProjects.length === 0 ? (
                <div className="flex flex-1 items-center justify-center">
                  <p className="text-center text-sm font-medium text-dark-secondary">
                    You Don't Have A Project Yet.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-0.5">
                  {recentProjects.map((project) => (
                    <ProjectRow
                      key={project.project_id}
                      project={project}
                      accountIndex={accountIndex}
                      onPin={handlePin}
                      showPin={false}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right panel */}
          <div className="flex flex-1 flex-col overflow-hidden rounded-xl bg-dark-surface-2 p-4">
            {/* Search */}
            <div className="relative mb-4">
              <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2">
                <SearchIcon />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search all projects"
                className="h-9 w-full rounded-lg border border-dark-border bg-dark-input pr-3 pl-9 text-sm text-dark-primary outline-none placeholder:text-dark-secondary focus:border-dark-border-focus focus:bg-dark-input-focus"
              />
            </div>

            {/* Project list */}
            <div className="flex flex-1 flex-col overflow-hidden">
              {filteredProjects.length === 0 ? (
                <div className="flex flex-1 items-center justify-center">
                  <p className="text-sm font-medium text-dark-secondary">
                    {search
                      ? 'No projects match your search.'
                      : "You Don't Have A Project Yet."}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-0.5">
                  {filteredProjects.map((project) => (
                    <ProjectRow
                      key={project.project_id}
                      project={project}
                      accountIndex={accountIndex}
                      onPin={handlePin}
                      pinning={pinningSlugs[project.project_slug] ?? false}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            {!search && projects.total > 0 && (
              <div className="mt-auto flex items-center justify-end gap-2 pt-3">
                <span className="text-xs text-dark-secondary">
                  {projects.from ?? 0} - {projects.current_page} of{' '}
                  {projects.last_page}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    canGoPrev && goToPage(projects.current_page - 1)
                  }
                  disabled={!canGoPrev}
                  className="flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-white/[0.07] disabled:opacity-30"
                >
                  <ChevronIcon dir="left" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    canGoNext && goToPage(projects.current_page + 1)
                  }
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

      <CreateProjectPanel open={panelOpen} onClose={closePanel} />
    </>
  );
};

export default ProjectsPage;
