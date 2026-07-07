import { usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import AccountSwitcher from '@/components/layouts/AccountSwitcher';
import NotificationPanel from '@/components/layouts/NotificationPanel';
import ProjectSwitcher from '@/components/layouts/ProjectSwitcher';
import ProjectInvitationModal from '@/components/projects/ProjectInvitationModal';
import ProjectSettingsModal from '@/components/projects/ProjectSettingsModal';
import ArrowDown from '@public/icons/small/arrow_down.svg';
import Bell from '@public/icons/small/bell.svg';
import Gear from '@public/icons/small/gear.svg';
import People from '@public/icons/small/people.svg';
import Search from '@public/icons/small/search.svg';
import Zeno from '@public/logos/logo.svg';

interface AppHeaderProps {
  onSearch?: (query: string) => void;
  onNotificationClick?: () => void;
  onSettingsClick?: () => void;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const IconButton = ({
  label,
  disabled = false,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) => (
  <button
    type="button"
    aria-label={label}
    disabled={disabled}
    onClick={onClick}
    className="flex h-8 w-8 items-center justify-center rounded-md text-dark-secondary transition-colors hover:bg-white/[0.07] hover:text-dark-primary disabled:cursor-not-allowed disabled:opacity-40"
  >
    {children}
  </button>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const Header = ({
  onSearch,
  onNotificationClick,
  onSettingsClick,
}: AppHeaderProps) => {
  const { project, projectNavigation, projectShare, account } = usePage().props;
  const [searchQuery, setSearchQuery] = useState('');
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<
    'general' | 'profile'
  >('general');

  const openSettings = (tab: 'general' | 'profile' = 'general') => {
    setSettingsInitialTab(tab);
    setSettingsOpen(true);
  };
  const projectMenuRef = useRef<HTMLDivElement>(null);

  // Close project menu on outside click
  useEffect(() => {
    if (!projectMenuOpen) return;

    const onPointerDown = (e: MouseEvent) => {
      if (!(projectMenuRef.current?.contains(e.target as Node) ?? false)) {
        setProjectMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [projectMenuOpen]);

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch?.(query);
  };

  return (
    <header className="flex items-center gap-2 bg-dark-surface-1 p-2 select-none">
      {/* ── Left: Logo + Project picker ── */}
      <div className="flex w-100 shrink-0 items-center gap-2">
        <div className="flex items-center justify-center rounded-lg bg-dark-surface-2 p-1">
          <Zeno className="h-6 w-6" />
        </div>

        <div ref={projectMenuRef} className="relative">
          <button
            type="button"
            onClick={() => setProjectMenuOpen((v) => !v)}
            aria-haspopup="true"
            aria-expanded={projectMenuOpen}
            aria-label="Select project"
            className="flex h-8 max-w-56 items-center gap-1 rounded-lg bg-dark-surface-2 px-2 text-dark-primary transition-colors hover:bg-dark-surface-3"
          >
            <span className="truncate text-sm font-bold whitespace-nowrap">
              {project?.project_name ?? 'Projects'}
            </span>
            <span
              className={`shrink-0 text-dark-secondary transition-transform duration-150 ${projectMenuOpen ? 'rotate-180' : ''}`}
            >
              <ArrowDown />
            </span>
          </button>
          <ProjectSwitcher
            open={projectMenuOpen}
            currentProject={project}
            projects={projectNavigation.projects}
            onClose={() => setProjectMenuOpen(false)}
            onSettingsOpen={() => openSettings('general')}
          />
        </div>
      </div>

      {/* ── Centre: Search ── */}
      <div className="flex min-w-0 flex-1 justify-center px-4" role="search">
        <div className="flex h-8 w-full max-w-90 items-center rounded-full bg-dark-surface-2 px-3 transition-colors focus-within:bg-dark-surface-3">
          <span className="mr-3 flex shrink-0 items-center justify-center text-dark-secondary">
            <Search className="h-5" />
          </span>
          <input
            type="search"
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Search"
            aria-label="Search"
            className="flex-1 bg-transparent text-normal font-bold text-dark-primary outline-none placeholder:text-dark-secondary [&::-webkit-search-cancel-button]:hidden"
          />
        </div>
      </div>

      {/* ── Right: Actions + Account switcher ── */}
      <div className="flex w-100 shrink-0 items-center justify-end gap-2">
        <div className="relative">
          <IconButton
            label="Notifications"
            disabled={project === null}
            onClick={() => {
              onNotificationClick?.();
              setNotificationsOpen((v) => !v);
            }}
          >
            <Bell />
          </IconButton>
          <NotificationPanel
            open={notificationsOpen}
            onClose={() => setNotificationsOpen(false)}
            project={project}
            accountIndex={account.index}
          />
        </div>
        <IconButton
          label="Invite members"
          disabled={project === null}
          onClick={() => setInviteOpen(true)}
        >
          <People />
        </IconButton>
        <IconButton label="Settings" onClick={onSettingsClick}>
          <Gear />
        </IconButton>

        <div className="mx-1.5 h-5 w-px bg-dark-border" aria-hidden="true" />

        {/* AccountSwitcher manages its own open state + outside-click */}
        <AccountSwitcher
          onOpen={() => setProjectMenuOpen(false)}
          onSettingsOpen={() => openSettings('profile')}
        />
      </div>

      <ProjectInvitationModal
        open={inviteOpen}
        project={project}
        share={projectShare}
        onClose={() => setInviteOpen(false)}
      />

      <ProjectSettingsModal
        open={settingsOpen}
        initialTab={settingsInitialTab}
        onClose={() => setSettingsOpen(false)}
      />
    </header>
  );
};

export default Header;
