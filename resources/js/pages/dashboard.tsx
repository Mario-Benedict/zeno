import { Head, router, usePage } from '@inertiajs/react';
import Header from '../components/header';
import AppLayout from '@/layouts/app-layout';

export default function Dashboard() {
  const { auth } = usePage().props;

  const logout = () => {
    router.post('/logout');
  };

  return (
    <>
      <Head title="Dashboard" />
      <div className="flex min-h-screen flex-col bg-[#FDFDFC] dark:bg-[#0a0a0a]">
        {/* <header className="border-b border-[#e3e3e0] bg-white dark:border-[#3E3E3A] dark:bg-[#161615]">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
            <span className="text-sm font-medium text-[#1b1b18] dark:text-[#EDEDEC]">
              {import.meta.env.VITE_APP_NAME || 'Laravel'}
            </span>
            <div className="flex items-center gap-4">
              <span className="text-sm text-[#706f6c] dark:text-[#A1A09A]">
                {auth.user?.name}
              </span>
              <button
                onClick={logout}
                className="rounded-lg border border-[#e3e3e0] px-3 py-1.5 text-sm text-[#706f6c] transition hover:border-[#1b1b18] hover:text-[#1b1b18] dark:border-[#3E3E3A] dark:text-[#A1A09A] dark:hover:border-[#EDEDEC] dark:hover:text-[#EDEDEC]"
              >
                Log out
              </button>
            </div>
          </div>
        </header> */}

        <header>
          <Header></Header>
        </header>
        
        <AppLayout>
          <main className="mx-auto w-full max-w-5xl px-6 py-12">
            <h1 className="text-2xl font-semibold text-[#1b1b18] dark:text-[#EDEDEC]">
              Dashboard
            </h1>
            <p className="mt-2 text-sm text-[#706f6c] dark:text-[#A1A09A]">
              Welcome back, {auth.user?.name}. You're logged in.
            </p>
          </main>
        </AppLayout>
      </div>
    </>
  );
}
