import ArrowDown from '@public/icons/small/arrow_down.svg';
import Bell from '@public/icons/small/bell.svg';
import Gear from '@public/icons/small/gear.svg';
import People from '@public/icons/small/people.svg';
import Search from '@public/icons/small/search.svg';
import Zeno from '@public/logos/logo.svg';
import { useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface User {
  name: string;
  avatarUrl?: string;
}

interface AppHeaderProps {
  projectName?: string;
  user?: User;
  onSearch?: (query: string) => void;
  onProjectClick?: () => void;
  onNotificationClick?: () => void;
  onContactsClick?: () => void;
  onSettingsClick?: () => void;
  onUserMenuClick?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const IconButton = ({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
}) => {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-md text-dark-secondary transition-colors hover:bg-white/[0.07] hover:text-dark-primary"
    >
      {children}
    </button>
  );
};

const Avatar = ({ user }: { user: User }) => {
  return (
    <div className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-dark-surface-3">
      {user.avatarUrl ? (
        <img
          src={user.avatarUrl}
          alt={user.name}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="text-[10px] font-semibold leading-none text-dark-primary">
          {getInitials(user.name)}
        </span>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const Header = ({
  projectName = 'Project Zeno',
  user = { name: 'Mario Benedict' },
  onSearch,
  onProjectClick,
  onNotificationClick,
  onContactsClick,
  onSettingsClick,
  onUserMenuClick,
}: AppHeaderProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch?.(query);
  };

  return (
    <header className="flex select-none items-center gap-2 bg-dark-surface-1 p-2">
      {/* ── Left: Logo + Project picker ── */}
      <div className="flex w-100 shrink-0 items-center gap-2">
        <div className="flex p-1 rounded-lg items-center justify-center bg-dark-surface-2">
          <Zeno className="h-6 w-6"/>
        </div>

        <button
          onClick={onProjectClick}
          aria-haspopup="true"
          aria-label="Select project"
          className="flex h-8 items-center gap-1 rounded-lg px-2 text-dark-primary bg-dark-surface-2"
        >
          <span className="whitespace-nowrap text-regular font-bold">{projectName}</span>
          <span className="text-dark-secondary"><ArrowDown /></span>
        </button>
      </div>

      {/* ── Center: Search ── */}
      <div className="flex min-w-0 flex-1 justify-center px-4" role="search">
        {/* Wrapper ini yang sekarang didandanin kaya input */}
        <div 
          className="
            flex w-full max-w-90 items-center h-8 rounded-full bg-dark-surface-2 px-3 
            transition-colors focus-within:bg-dark-surface-3
          "
        >
          {/* Icon ditaruh biasa, sejajar pake flex, dikasih margin kanan (mr-2) */}
          <span className="flex shrink-0 items-center justify-center text-dark-secondary mr-3">
            <Search className="h-5"/>
          </span>

          {/* Input-nya dibikin background transparan dan ambil sisa ruang (flex-1) */}
          <input
            type="search"
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Search"
            aria-label="Search"
            className="
              flex-1 bg-transparent outline-none
              text-regular font-bold text-dark-primary 
              placeholder:text-dark-secondary
              [&::-webkit-search-cancel-button]:hidden
            "
          />
        </div>
      </div>

      {/* ── Right: Icons + Divider + User menu ── */}
      <div className="flex w-100 shrink-0 items-center justify-end gap-2">
        <IconButton label="Notifications" onClick={onNotificationClick}>
          <Bell />
        </IconButton>

        <IconButton label="Contacts" onClick={onContactsClick}>
          <People />
        </IconButton>

        <IconButton label="Settings" onClick={onSettingsClick}>
          <Gear />
        </IconButton>

        <div className="mx-1.5 h-5 w-px bg-dark-border" aria-hidden="true" />

        <button
          onClick={onUserMenuClick}
          aria-haspopup="true"
          aria-label="User menu"
          className="flex items-center h-8 gap-2 rounded-lg px-2 text-dark-primary bg-dark-surface-2"
        >
          <span className="whitespace-nowrap text-regular font-bold">{user.name}</span>
          <Avatar user={user} />
          <span className="text-dark-secondary"><ArrowDown /></span>
        </button>
      </div>
    </header>
  );
};

export default Header;