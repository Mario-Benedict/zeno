import type { ReactNode } from 'react';
import Zeno from '@public/logos/logo-mono.svg';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

const AuthLayout = ({ children, title, description }: AuthLayoutProps) => (
  <div className="flex min-h-screen items-center justify-center bg-dark-surface-1 px-4 py-12">
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-dark-border bg-dark-surface-2 p-8">
        <div className="mb-6 flex flex-col items-center gap-2">
          <Zeno width={40} height={40} className="text-dark-primary" />
          <div className="text-center">
            <h1 className="text-xl font-semibold text-dark-primary">{title}</h1>
            {description && (
              <p className="mt-1 text-sm text-dark-secondary">{description}</p>
            )}
          </div>
        </div>
        {children}
      </div>
    </div>
  </div>
);

export default AuthLayout;
