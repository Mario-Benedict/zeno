import { Head } from '@inertiajs/react';
import type { ReactNode } from 'react';
import Header from '@/components/layouts/Header';
import Sidebar from '@/components/layouts/Sidebar';

interface AppLayoutProps {
  children: ReactNode;
  project: {
    project_id: string;
    project_name: string;
    project_slug: string;
  };
}

const AppLayout = ({ children, project }: AppLayoutProps) => {
    return (
      <>
        <Head title={project.project_name} />
        <header>
          <Header />
        </header>
        <main className="flex">
          <Sidebar projectSlug={project.project_slug} />
          <div className="flex w-full h-[calc(100dvh-48px)] pr-2 pb-2 bg-dark-surface-1">
            <div className="flex flex-1 q-full h-full p-2 rounded-lg border-2 border-dark-surface-3 overflow-clip">
              {children}
            </div>
          </div>
        </main>
      </>
    );
};

export default AppLayout;
