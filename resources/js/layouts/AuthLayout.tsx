import type { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

export default function AuthLayout({
  children,
  title,
  description,
}: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FDFDFC] px-4 py-12 dark:bg-[#0a0a0a]">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-[#1b1b18] dark:text-[#EDEDEC]">
            {title}
          </h1>
          {description && (
            <p className="mt-2 text-sm text-[#706f6c] dark:text-[#A1A09A]">
              {description}
            </p>
          )}
        </div>
        <div className="rounded-xl bg-white p-8 shadow-[inset_0px_0px_0px_1px_rgba(26,26,0,0.16)] dark:bg-[#161615] dark:shadow-[inset_0px_0px_0px_1px_#fffaed2d]">
          {children}
        </div>
      </div>
    </div>
  );
}
