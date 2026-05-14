import { Head } from '@inertiajs/react';
import type { ReactNode } from 'react';

import Header from '@/components/layouts/Header';
import Sidebar from '@/components/layouts/Sidebar';

interface AppLayoutProps {
    children: ReactNode;
    title: string;
}

export default function AppLayout({ children, title }: AppLayoutProps) {
    return (
      <>
        <Head title={title} />
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
