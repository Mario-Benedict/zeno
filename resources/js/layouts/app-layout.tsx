import { ReactNode } from 'react';
import Sidebar from '@/components/sidebar';

interface AppLayoutProps {
    children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#0f0f0f' }}>
            <Sidebar />
            <main className="main-with-sidebar" style={{ flex: 1 }}>
                {children}
            </main>
        </div>
    );
}