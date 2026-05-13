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
          {children}
        </main>
      </>
    );
}
