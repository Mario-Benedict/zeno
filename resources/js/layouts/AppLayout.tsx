import type { ReactNode } from 'react';
import { usePage } from '@inertiajs/react';
import Header from '@/components/layouts/Header';
import Sidebar from '@/components/layouts/Sidebar';

interface PageProps {
    project?: {
        project_id: string;
        project_name: string;
        project_slug: string;
    };
    [key: string]: unknown;
}

interface AppLayoutProps {
    children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
    const { project } = usePage<PageProps>().props;

    return (
        <>
            <header>
                <Header />
            </header>
            <main className="flex">
                <Sidebar projectSlug={project?.project_slug ?? ''} />
                <div className="flex w-full h-[calc(100dvh-48px)] pr-2 pb-2 bg-dark-surface-1">
                    <div className="flex flex-1 w-full h-full p-2 rounded-lg border-2 border-dark-surface-3 overflow-clip">
                        {children}
                    </div>
                </div>
            </main>
        </>
    );
};

export default AppLayout;
