import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import AccountSwitcher from '@/components/layouts/AccountSwitcher';
import CreateProjectPanel from '@/components/projects/CreateProjectPanel';
import ProjectListRow from '@/components/projects/ProjectListRow';
import ProjectSettingsModal from '@/components/projects/ProjectSettingsModal';
import { useTranslation } from '@/hooks/useTranslation';
import { accountPath, projectPath } from '@/lib/accountRoutes';
import type { PaginatedProjects, ProjectSummary } from '@/types';
import ChevronLeftIcon from '@public/icons/small/chevron_left.svg';
import SearchIconSvg from '@public/icons/small/search.svg';
import Zeno from '@public/logos/logo-mono.svg';

interface ProjectsPageProps {
  recentProjects: ProjectSummary[];
  projects: PaginatedProjects;
  [key: string]: unknown;
}

const sortProjects = (items: ProjectSummary[]) => {
  return [...items].sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;

    return a.project_name.localeCompare(b.project_name);
  });
};

const ProjectsPage = () => {
  const { t } = useTranslation();
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
  const [settingsOpen, setSettingsOpen] = useState(false);

  const hasProjects = projects.total > 0;
  const pageTitle = hasProjects
    ? t('projects.pageTitle')
    : t('projects.getStarted');

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
          <AccountSwitcher onSettingsOpen={() => setSettingsOpen(true)} />
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
              {/* Brand mark: stays a fixed dark chip + light glyph regardless
                  of the active theme, same rule as the header logo. */}
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-static-dark-surface-2 text-static-dark-primary">
                <Zeno />
              </div>
              <div>
                <p className="text-sm font-semibold text-dark-primary">
                  {t('projects.createCardTitle')}
                </p>
                <p className="mt-0.5 text-xs text-dark-secondary">
                  {t('projects.createCardDescription')}
                </p>
              </div>
            </button>

            {/* Recently Opened */}
            <div className="flex flex-1 flex-col overflow-hidden rounded-xl bg-dark-surface-2 p-4">
              <h2 className="mb-3 text-sm font-semibold text-dark-primary">
                {t('projects.recentlyOpened')}
              </h2>
              {recentProjects.length === 0 ? (
                <div className="flex flex-1 items-center justify-center">
                  <p className="text-center text-sm font-medium text-dark-secondary">
                    {t('projects.noProjectsYet')}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-0.5">
                  {recentProjects.map((project) => (
                    <ProjectListRow
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
                <SearchIconSvg className="h-[15px] w-[15px] text-dark-secondary" />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('projects.searchPlaceholder')}
                className="h-9 w-full rounded-lg border border-dark-border bg-dark-input pr-3 pl-9 text-sm text-dark-primary outline-none placeholder:text-dark-secondary focus:border-dark-border-focus focus:bg-dark-input-focus"
              />
            </div>

            {/* Project list */}
            <div className="flex flex-1 flex-col overflow-hidden">
              {filteredProjects.length === 0 ? (
                <div className="flex flex-1 items-center justify-center">
                  <p className="text-sm font-medium text-dark-secondary">
                    {search
                      ? t('projects.noSearchResults')
                      : t('projects.noProjectsYet')}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-0.5">
                  {filteredProjects.map((project) => (
                    <ProjectListRow
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
                  {t('projects.paginationSummary', {
                    from: projects.from ?? 0,
                    currentPage: projects.current_page,
                    lastPage: projects.last_page,
                  })}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    canGoPrev && goToPage(projects.current_page - 1)
                  }
                  disabled={!canGoPrev}
                  className="flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-white/[0.07] disabled:opacity-30"
                >
                  <ChevronLeftIcon className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    canGoNext && goToPage(projects.current_page + 1)
                  }
                  disabled={!canGoNext}
                  className="flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-white/[0.07] disabled:opacity-30"
                >
                  <ChevronLeftIcon className="h-3.5 w-3.5 rotate-180" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <CreateProjectPanel open={panelOpen} onClose={closePanel} />

      <ProjectSettingsModal
        open={settingsOpen}
        initialTab="profile"
        onClose={() => setSettingsOpen(false)}
      />
    </>
  );
};

export default ProjectsPage;
