import { usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import AccountMenu, {
  accountAvatarColor,
} from '@/components/layouts/AccountMenu';
import ArrowDown from '@public/icons/small/arrow_down.svg';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getInitials = (name: string): string =>
  name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

// ─── AccountSwitcher ──────────────────────────────────────────────────────────
//
// Self-contained trigger button + dropdown.  Drop it anywhere in a header and
// it manages its own open/close state, outside-click dismissal, and the full
// account-switcher dropdown (via AccountMenu).
//
// Optional `onOpen` callback lets a parent close sibling menus (e.g. the
// project-switcher) when this one opens.

interface AccountSwitcherProps {
  /** Called when the dropdown opens, so a parent can close other menus. */
  onOpen?: () => void;
}

const AccountSwitcher = ({ onOpen }: AccountSwitcherProps = {}) => {
  const { auth, account } = usePage().props;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const userName = auth.user?.name ?? 'User';

  // ── Close on outside click ─────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  const toggle = () => {
    const willOpen = !open;
    setOpen(willOpen);
    if (willOpen) onOpen?.();
  };

  return (
    <div ref={ref} className="relative">
      {/* ── Trigger button ─────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="User menu"
        className="flex h-8 max-w-60 items-center gap-2 rounded-lg bg-dark-surface-2 px-2 text-dark-primary transition-colors select-none hover:bg-dark-surface-3"
      >
        {/* Colour-coded avatar matching the account-menu style */}
        <div
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${accountAvatarColor(account.index)} text-micro font-bold text-white`}
        >
          {getInitials(userName)}
        </div>

        <span className="truncate text-small font-bold whitespace-nowrap">
          {userName}
        </span>

        <span className="shrink-0 text-dark-secondary">
          <ArrowDown />
        </span>
      </button>

      {/* ── Dropdown ───────────────────────────────────────────────────────── */}
      <AccountMenu open={open} onClose={() => setOpen(false)} />
    </div>
  );
};

export default AccountSwitcher;
