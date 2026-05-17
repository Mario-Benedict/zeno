import { Head, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';

export default function Dashboard() {
  const { auth } = usePage().props;

  // const logout = () => {
  //   router.post('/logout');
  // };

  return (
    <>
      <Head title="Dashboard" />
      <AppLayout>
        <div className="mx-auto w-full max-w-5xl px-6 py-12 bg-dark-surface-1">
          <h1 className="text-2xl font-semibold text-[#1b1b18] dark:text-[#EDEDEC]">
            Dashboard
          </h1>
          <p className="mt-2 text-sm text-[#706f6c] dark:text-[#A1A09A]">
            Welcome back, {auth.user?.name}. You're logged in.
          </p>
        </div>
      </AppLayout>
    </>
  );
}
