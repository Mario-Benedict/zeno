import { usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';

const Dashboard = () => {
  const { auth } = usePage().props;

  return (
    <AppLayout title="Dashboard">
      <div className="mx-auto w-full max-w-5xl px-6 py-12">
        <h1 className="text-2xl font-semibold text-dark-primary">Dashboard</h1>
        <p className="mt-2 text-sm text-dark-secondary">
          Welcome back, {auth.user?.name}. You're logged in.
        </p>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
