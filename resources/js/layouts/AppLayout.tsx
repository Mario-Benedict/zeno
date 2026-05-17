import type { ReactNode } from 'react';

import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';

interface AppLayoutProps {
    children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
    return (
      <>
        <header>
          <Header />
        </header>
        <main className="flex">
          <Sidebar />
          <div className="flex w-full h-[calc(100dvh-48px)] pr-2 pb-2 bg-dark-surface-1">
            <div className="flex flex-1 q-full h-full p-2 rounded-lg border-2 border-dark-surface-3 overflow-clip">
              {children}
            </div>
          </div>
        </main>
      </>
    );
}
