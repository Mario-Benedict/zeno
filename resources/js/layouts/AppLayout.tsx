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
};

const AppLayout = ({ children, project }: AppLayoutProps) => {
    return (
      <>
        <header>
          <Header />
        </header>
        <main className="flex">
          <Sidebar projectSlug={project.project_slug} />
          <div className="flex flex-1 min-w-0 h-[calc(100dvh-48px)] pr-2 pb-2 bg-dark-surface-1 overflow-clip">
            <div className="flex flex-1 min-w-0 min-h-0 p-2 rounded-lg border-2 border-dark-surface-3 overflow-clip">
              {children}
            </div>
          </div>
        </main>
      </>
    );
};

export default AppLayout;
