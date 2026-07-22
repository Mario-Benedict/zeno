import { router, usePage } from '@inertiajs/react';
import { useTranslation } from '@/hooks/useTranslation';
import { accountPath } from '@/lib/accountRoutes';
import RightArrow from '@public/icons/small/arrow_down.svg';
import CheckIcon from '@public/icons/small/check.svg';
import PersonIcon from '@public/icons/small/person.svg';
import PersonAddIcon from '@public/icons/small/person_add.svg';
import PersonDeleteIcon from '@public/icons/small/person_delete.svg';
import SignOutIcon from '@public/icons/small/signout.svg';
import AccountMenuButton from './AccountMenuButton';
import AccountMenuDivider from './AccountMenuDivider';

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

// ─── Main Component ───────────────────────────────────────────────────────────

interface AccountMenuProps {
  open: boolean;
  onClose: () => void;
  onSettingsOpen: () => void;
}

const AccountMenu = ({ open, onClose, onSettingsOpen }: AccountMenuProps) => {
  const { auth, accountsList } = usePage().props;
  const { t } = useTranslation();
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

  return (
    <div className="absolute top-10 right-0 z-40 w-80 rounded-xl border border-dark-border bg-dark-surface-2 p-2 shadow-2xl">
      {/* ── Signed-in accounts ─────────────────────────────────────── */}
      <div className="px-2 pt-2 pb-1">
        <p className="text-xsmall font-semibold tracking-wide text-dark-primary uppercase">
          {t('account.signedInAccounts')}
        </p>
      </div>

      <div className="scrollbar-app max-h-72 space-y-0.5 overflow-y-auto pr-1">
        {accountsList.map((acct) =>
          acct.is_active ? (
            <div
              key={acct.index}
              className="flex items-center gap-3 rounded-lg bg-dark-surface-1 px-2 py-2"
            >
              {acct.avatar ? (
                <img
                  src={acct.avatar}
                  alt={acct.name}
                  className="h-9 w-9 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${accountAvatarColor(acct.index)} text-xsmall font-bold text-white`}
                >
                  {getInitials(acct.name)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-small font-semibold text-dark-primary">
                  {acct.name}
                </p>
                <p className="truncate text-xsmall font-medium text-dark-secondary">
                  {acct.email}
                </p>
              </div>
              <CheckIcon className="text-accent-blue" />
            </div>
          ) : (
            <button
              key={acct.index}
              type="button"
              onClick={() => {
                onClose();
                router.visit(accountPath(acct.index, '/projects'));
              }}
              className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-white/[0.07]"
            >
              {acct.avatar ? (
                <img
                  src={acct.avatar}
                  alt={acct.name}
                  className="h-9 w-9 shrink-0 rounded-full object-cover opacity-80"
                />
              ) : (
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${accountAvatarColor(acct.index)} text-xsmall font-bold text-white opacity-80`}
                >
                  {getInitials(acct.name)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-small font-semibold text-dark-primary">
                  {acct.name}
                </p>
                <p className="truncate text-xsmall text-dark-secondary">
                  {acct.email}
                </p>
              </div>
              <RightArrow className="w-4 rotate-270" />
            </button>
          ),
        )}
      </div>

      <AccountMenuDivider />

      {/* ── Actions ────────────────────────────────────────────────── */}
      <AccountMenuButton
        onClick={() => {
          onClose();
          onSettingsOpen();
        }}
      >
        <PersonIcon />
        {t('account.manageAccount')}
      </AccountMenuButton>

      <AccountMenuButton onClick={() => logout('add_account')}>
        <PersonAddIcon />
        {t('account.addAnotherAccount')}
      </AccountMenuButton>

      <AccountMenuDivider />

      <AccountMenuButton tone="danger" onClick={() => logout('home')}>
        <SignOutIcon />
        {t('account.signOut')}
      </AccountMenuButton>

      {accountsList.length > 1 && (
        <AccountMenuButton tone="danger" onClick={() => logout('signout_all')}>
          <PersonDeleteIcon />
          {t('account.signOutOfAllAccounts')}
        </AccountMenuButton>
      )}
    </div>
  );
};

export default AccountMenu;
