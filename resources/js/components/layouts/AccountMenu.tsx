import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { accountPath } from '@/lib/accountRoutes';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getInitials = (name: string): string =>
  name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

export const ACCOUNT_AVATAR_COLORS = [
  'bg-accent-orange',
  'bg-accent-blue',
  'bg-accent-purple',
  'bg-accent-green',
  'bg-accent-pink',
  'bg-accent-cyan',
];

export const accountAvatarColor = (index: number) =>
  ACCOUNT_AVATAR_COLORS[index % ACCOUNT_AVATAR_COLORS.length];

// ─── Sub-components ───────────────────────────────────────────────────────────

const MenuButton = ({
  children,
  tone = 'default',
  onClick,
}: {
  children: ReactNode;
  tone?: 'default' | 'danger';
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-small font-medium transition-colors ${
      tone === 'danger'
        ? 'text-status-error hover:bg-status-error/10'
        : 'text-dark-primary hover:bg-white/[0.07]'
    }`}
  >
    {children}
  </button>
);

const Divider = () => <div className="my-1.5 h-px bg-dark-border" />;

// ─── Main Component ───────────────────────────────────────────────────────────

interface AccountMenuProps {
  open: boolean;
  onClose: () => void;
}

const AccountMenu = ({ open, onClose }: AccountMenuProps) => {
  const { auth, account, accountsList } = usePage().props;
  const [view, setView] = useState<'main' | 'manage'>('main');
  const user = auth.user;

  if (!open || user === null) return null;

  const logout = (redirectTo: string) => {
    router.post(
      '/logout',
      { redirect_to: redirectTo },
      {
        preserveScroll: true,
        onBefore: () => {
          onClose();
          return true;
        },
      },
    );
  };

  // ── Manage account view ────────────────────────────────────────────────────
  if (view === 'manage') {
    return (
      <div className="absolute top-10 right-0 z-40 w-80 rounded-xl border border-dark-border bg-dark-surface-2 p-2 shadow-2xl">
        <div className="flex items-center gap-2 px-1 py-1">
          <button
            type="button"
            onClick={() => setView('main')}
            className="flex h-7 w-7 items-center justify-center rounded-md text-dark-secondary transition-colors hover:bg-white/[0.07] hover:text-dark-primary"
            aria-label="Back"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <p className="text-small font-semibold text-dark-primary">
            Manage account
          </p>
        </div>

        <div className="mt-2 flex flex-col items-center px-4 pt-3 pb-4 text-center">
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-full ${accountAvatarColor(account.index)} text-large font-bold text-white`}
          >
            {getInitials(user.name)}
          </div>
          <h3 className="mt-3 max-w-full truncate text-normal font-semibold text-dark-primary">
            {user.name}
          </h3>
          <p className="max-w-full truncate text-small text-dark-secondary">
            {user.email}
          </p>
          <span className="mt-2 rounded-full bg-dark-surface-3 px-2.5 py-0.5 text-xsmall font-medium text-dark-secondary">
            Account #{account.index}
          </span>
        </div>

        <div className="rounded-lg bg-dark-surface-1 px-3 py-2.5">
          <p className="text-xsmall font-semibold tracking-wide text-dark-secondary uppercase">
            Email status
          </p>
          <p className="mt-0.5 text-small font-medium text-dark-primary">
            {user.email_verified_at ? 'Verified' : 'Not verified'}
          </p>
        </div>

        <Divider />

        <Link
          href={accountPath(account.index, '/account')}
          onClick={onClose}
          className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-small font-medium text-dark-primary transition-colors hover:bg-white/[0.07]"
        >
          Account settings
        </Link>

        <Divider />

        <MenuButton tone="danger" onClick={() => logout('home')}>
          Sign out
        </MenuButton>
      </div>
    );
  }

  // ── Main view ──────────────────────────────────────────────────────────────
  return (
    <div className="absolute top-10 right-0 z-40 w-80 rounded-xl border border-dark-border bg-dark-surface-2 p-2 shadow-2xl">
      {/* ── Signed-in accounts ─────────────────────────────────────── */}
      <div className="px-3 pt-2 pb-1">
        <p className="text-xsmall font-semibold tracking-wide text-dark-secondary uppercase">
          Signed-in accounts
        </p>
      </div>

      <div className="scrollbar-app max-h-72 space-y-0.5 overflow-y-auto pr-1">
        {accountsList.map((acct) =>
          acct.is_active ? (
            <div
              key={acct.index}
              className="flex items-center gap-3 rounded-lg bg-dark-surface-1 px-3 py-2.5"
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${accountAvatarColor(acct.index)} text-xsmall font-bold text-white`}
              >
                {getInitials(acct.name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-small font-semibold text-dark-primary">
                  {acct.name}
                </p>
                <p className="truncate text-xsmall text-dark-secondary">
                  {acct.email}
                </p>
              </div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0 text-accent-blue"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          ) : (
            <button
              key={acct.index}
              type="button"
              onClick={() => {
                onClose();
                router.visit(accountPath(acct.index, '/projects'));
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-white/[0.07]"
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${accountAvatarColor(acct.index)} text-xsmall font-bold text-white opacity-80`}
              >
                {getInitials(acct.name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-small font-semibold text-dark-primary">
                  {acct.name}
                </p>
                <p className="truncate text-xsmall text-dark-secondary">
                  {acct.email}
                </p>
              </div>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0 text-dark-secondary"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          ),
        )}
      </div>

      <Divider />

      {/* ── Actions ────────────────────────────────────────────────── */}
      <MenuButton onClick={() => setView('manage')}>
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0 text-dark-secondary"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        Manage account
      </MenuButton>

      <MenuButton onClick={() => logout('add_account')}>
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0 text-dark-secondary"
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <line x1="19" y1="8" x2="19" y2="14" />
          <line x1="22" y1="11" x2="16" y2="11" />
        </svg>
        Add another account
      </MenuButton>

      <Divider />

      <MenuButton tone="danger" onClick={() => logout('home')}>
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0"
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        Sign out
      </MenuButton>

      {accountsList.length > 1 && (
        <MenuButton tone="danger" onClick={() => logout('signout_all')}>
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0"
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="23" y1="11" x2="17" y2="17" />
            <line x1="17" y1="11" x2="23" y2="17" />
          </svg>
          Sign out of all accounts
        </MenuButton>
      )}
    </div>
  );
};

export default AccountMenu;
