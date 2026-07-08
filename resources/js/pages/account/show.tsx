import { Head, Link, router, usePage } from '@inertiajs/react';
import { useTranslation } from '@/hooks/useTranslation';
import { accountPath } from '@/lib/accountRoutes';
import type { Auth } from '@/types';
import Zeno from '@public/logos/logo.svg';

interface AccountPageProps {
  auth: Auth;
  [key: string]: unknown;
}

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const AccountPage = () => {
  const { t } = useTranslation();
  const { auth, account } = usePage<AccountPageProps>().props;
  const accountIndex = account.index;
  const user = auth.user;

  const logoutTo = (redirectTo: 'home' | 'login' | 'register') => {
    router.post('/logout', { redirect_to: redirectTo });
  };

  return (
    <>
      <Head title={t('account.pageTitle')} />

      <div className="flex min-h-dvh flex-col bg-dark-surface-1 text-dark-primary">
        <header className="flex h-12 items-center justify-between px-6">
          <Link
            href={accountPath(accountIndex, '/projects')}
            className="flex items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-white/[0.07]"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-dark-surface-2">
              <Zeno className="h-5 w-5" />
            </span>
            <span className="text-sm font-semibold">
              {t('account.projects')}
            </span>
          </Link>
        </header>

        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-8">
          <div className="rounded-lg border border-dark-border bg-dark-surface-2 p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-accent-orange text-xl font-bold text-white">
                {getInitials(user?.name ?? 'User')}
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-semibold">
                  {user?.name ?? 'User'}
                </h1>
                <p className="truncate text-sm text-dark-secondary">
                  {user?.email}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-md bg-dark-surface-1 p-4">
                <p className="text-xs font-semibold text-dark-secondary uppercase">
                  {t('account.emailStatus')}
                </p>
                <p className="mt-1 text-sm font-medium">
                  {user?.email_verified_at
                    ? t('account.verified')
                    : t('account.notVerified')}
                </p>
              </div>
              <div className="rounded-md bg-dark-surface-1 p-4">
                <p className="text-xs font-semibold text-dark-secondary uppercase">
                  {t('account.accountRoute')}
                </p>
                <p className="mt-1 text-sm font-medium">/u/{accountIndex}</p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => logoutTo('login')}
                className="rounded-md border border-dark-border px-4 py-2 text-sm font-semibold transition-colors hover:bg-white/[0.07]"
              >
                {t('account.switchAccounts')}
              </button>
              <button
                type="button"
                onClick={() => logoutTo('register')}
                className="rounded-md border border-dark-border px-4 py-2 text-sm font-semibold transition-colors hover:bg-white/[0.07]"
              >
                {t('account.createAnotherAccount')}
              </button>
              <button
                type="button"
                onClick={() => logoutTo('home')}
                className="rounded-md bg-dark-primary px-4 py-2 text-sm font-semibold text-dark-surface-1 transition-opacity hover:opacity-90"
              >
                {t('account.signOut')}
              </button>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default AccountPage;
