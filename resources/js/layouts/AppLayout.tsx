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

const AppLayout = ({ children, project }: AppLayoutProps) => (
  <>
    <Head title={project.project_name} />
    <header>
      <Header />
    </header>
    <main className="flex">
      <Sidebar projectSlug={project.project_slug} />
      {children}
    </main>
  </>
);

export default AppLayout;
