import type { ReactNode } from 'react';
import Header from '@/components/layouts/Header';
import Sidebar from '@/components/layouts/Sidebar';

type Project = {
  project_id: string;
  project_name: string;
  project_slug: string;
};

interface AppLayoutProps {
  children: ReactNode;
  project: Project;
}

const AppLayout = ({ children, project }: AppLayoutProps) => {
  return (
    <>
      <header>
        <Header />
      </header>
      <main className="flex">
        <Sidebar projectSlug={project.project_slug} />
        <div className="flex h-[calc(100dvh-48px)] min-w-0 flex-1 overflow-clip bg-dark-surface-1 pr-2 pb-2">
          <div className="flex min-h-0 min-w-0 flex-1 overflow-clip rounded-lg border-2 border-dark-surface-3 p-2">
            {children}
          </div>
        </div>
      </main>
    </>
  );
};

export default AppLayout;
