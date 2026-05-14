import ArrowDown from '@public/icons/small/arrow_down.svg';
import Bell from '@public/icons/small/bell.svg';
import Gear from '@public/icons/small/gear.svg';
import People from '@public/icons/small/people.svg';
import Search from '@public/icons/small/search.svg';
import Zeno from '@public/logos/logo.svg';
import type { ReactNode } from 'react';
import { useState } from 'react';

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

const getInitials = (name: string): string =>
  name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

const IconButton = ({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick?: () => void;
  children: ReactNode;
}) => (
  <button
    aria-label={label}
    onClick={onClick}
    className="flex h-8 w-8 items-center justify-center rounded-md text-dark-secondary transition-colors hover:bg-white/[0.07] hover:text-dark-primary"
  >
    {children}
  </button>
);

const Avatar = ({ user }: { user: User }) => (
  <div className="flex h-7.5 w-7.5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-dark-surface-2">
    {user.avatarUrl ? (
      <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
    ) : (
      <span className="text-[10px] font-semibold leading-none text-dark-primary">
        {getInitials(user.name)}
      </span>
    )}
  </div>
);

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
    <header className="flex h-12 select-none items-center gap-2 border-b border-dark-border bg-dark-surface-1 px-2">
      <div className="flex w-100 shrink-0 items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center bg-dark-surface-1">
          <Zeno />
        </div>
        <button
          onClick={onProjectClick}
          aria-haspopup="true"
          aria-label="Select project"
          className="flex items-center gap-1 rounded-md px-1.5 py-1 text-dark-primary transition-colors hover:bg-white/[0.07]"
        >
          <span className="whitespace-nowrap text-sm font-medium">{projectName}</span>
          <span className="text-dark-secondary">
            <ArrowDown />
          </span>
        </button>
      </div>

      <div className="flex min-w-0 flex-1 justify-center px-4" role="search">
        <div className="relative w-full max-w-90">
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-dark-secondary">
            <Search />
          </span>
          <input
            type="search"
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Search"
            aria-label="Search"
            className="h-8 w-full rounded-full border border-dark-border bg-dark-input pl-8 pr-3 text-[13px] text-dark-primary outline-none transition-colors placeholder:text-dark-secondary focus:border-dark-border-focus focus:bg-dark-input-focus [&::-webkit-search-cancel-button]:hidden"
          />
        </div>
      </div>

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
          className="flex items-center gap-2 rounded-md px-1.5 py-1 text-dark-primary transition-colors hover:bg-white/[0.07]"
        >
          <Avatar user={user} />
          <span className="whitespace-nowrap text-[13px] font-medium">{user.name}</span>
          <span className="text-dark-secondary">
            <ArrowDown />
          </span>
        </button>
      </div>
    </header>
  );
};

export default Header;
