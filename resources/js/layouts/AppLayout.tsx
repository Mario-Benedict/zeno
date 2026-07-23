import { useState } from 'react';
import type { ReactNode } from 'react';
import Header from '@/components/layouts/Header';
import Sidebar from '@/components/layouts/Sidebar';
import ProjectSettingsModal from '@/components/projects/ProjectSettingsModal';
import type { CurrentProject } from '@/types';

interface AppLayoutProps {
  children: ReactNode;
  project: CurrentProject;
}

const AppLayout = ({ children, project }: AppLayoutProps) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<
    'general' | 'profile'
  >('general');

  const openSettings = (tab: 'general' | 'profile' = 'general') => {
    setSettingsInitialTab(tab);
    setSettingsOpen(true);
  };

  return (
    <>
      <Header onOpenSettings={openSettings} />
      <main className="flex">
        <Sidebar projectSlug={project.project_slug} />
        <div className="flex h-[calc(100dvh-var(--header-height))] min-w-0 flex-1 overflow-clip bg-dark-surface-1 pr-2 pb-2">
          <div className="flex min-h-0 min-w-0 flex-1 overflow-clip rounded-lg border-2 border-dark-surface-3 p-2">
            {children}
          </div>
        </div>
      </main>

      <ProjectSettingsModal
        open={settingsOpen}
        initialTab={settingsInitialTab}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  );
};

export default AppLayout;
