import { Link, usePage } from '@inertiajs/react';
import { projectPath } from '@/lib/accountRoutes';

import BoardIcon from '@public/icons/large/board.svg';
import CalendarIcon from '@public/icons/large/calendar.svg';
import DashboardIcon from '@public/icons/large/dashboard.svg';

interface NavItem {
  name: string;
  href: string;
  icon: React.FC;
}

const ChatIcon: React.FC = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const LLMIcon: React.FC = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
  </svg>
);

const NotesIcon: React.FC = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="8" y1="13" x2="16" y2="13" />
    <line x1="8" y1="17" x2="12" y2="17" />
  </svg>
);

const RemindersIcon: React.FC = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const SettingsIcon: React.FC = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const buildNavItems = (
  accountIndex: number,
  projectSlug: string,
): NavItem[] => [
  {
    name: 'Dashboard',
    href: projectPath(accountIndex, projectSlug, '/dashboard'),
    icon: DashboardIcon,
  },
  {
    name: 'Board',
    href: projectPath(accountIndex, projectSlug, '/kanban'),
    icon: BoardIcon,
  },
  {
    name: 'Calendar',
    href: projectPath(accountIndex, projectSlug, '/calendar'),
    icon: CalendarIcon,
  },
  {
    name: 'Chat',
    href: projectPath(accountIndex, projectSlug, '/chat'),
    icon: ChatIcon,
  },
  {
    name: 'LLM',
    href: projectPath(accountIndex, projectSlug, '/llm-chat'),
    icon: LLMIcon,
  },
  {
    name: 'Notes',
    href: projectPath(accountIndex, projectSlug, '/notes'),
    icon: NotesIcon,
  },
  {
    name: 'Reminders',
    href: projectPath(accountIndex, projectSlug, '/reminders'),
    icon: RemindersIcon,
  },
];

interface SidebarProps {
  projectSlug: string;
}

const Sidebar = ({ projectSlug }: SidebarProps) => {
  const page = usePage();
  const { url } = page;
  const accountIndex = page.props.account.index;
  const navItems = buildNavItems(accountIndex, projectSlug);
  const projectHome = projectPath(accountIndex, projectSlug);
  const settingsPath = projectPath(accountIndex, projectSlug, '/settings');

  const isActive = (href: string) => {
    if (href === projectHome) return url === href;
    return url.startsWith(href);
  };

  return (
    <aside className="flex h-[calc(100dvh-var(--header-height))] flex-col bg-dark-surface-1 px-2 pb-2">
      <nav className="flex h-full flex-col justify-between rounded-lg bg-dark-surface-2 p-2">
        <div className="flex flex-1 [scrollbar-width:none] flex-col items-center gap-0.5 overflow-x-hidden overflow-y-auto py-1 pr-0.5 [&::-webkit-scrollbar]:hidden">
          {navItems.map(({ name, href, icon: Icon }) => {
            const active = isActive(href);

            return (
              <Link
                key={name}
                href={href}
                // Container utama (teks akan ikut warna ini)
                className={`group flex w-full flex-col items-center justify-center gap-2 py-2 text-micro leading-none font-medium transition-colors duration-150 ${
                  active
                    ? 'text-dark-primary'
                    : 'text-dark-secondary hover:text-dark-primary'
                }`}
              >
                {/* Bungkus Icon: Di sini background birunya ditaruh */}
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors duration-150 ${
                    active
                      ? 'bg-accent-blue text-dark-primary'
                      : 'bg-transparent group-hover:bg-dark-surface-3'
                  }`}
                >
                  <Icon />
                </div>
                <span>{name}</span>
              </Link>
            );
          })}
        </div>
        <div className="flex flex-col items-center pb-1">
          <div className="my-2 h-px w-10 bg-dark-secondary" />
          <Link
            className={`group flex w-full flex-col items-center justify-center gap-1.5 py-1.5 text-micro leading-none font-medium transition-colors duration-150 ${
              isActive(settingsPath)
                ? 'text-white'
                : 'text-dark-secondary hover:text-dark-primary'
            }`}
            href={settingsPath}
          >
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors duration-150 ${
                isActive(settingsPath)
                  ? 'bg-accent-blue text-white'
                  : 'bg-transparent group-hover:bg-white/[0.07]'
              }`}
            >
              <SettingsIcon />
            </div>
            <span>Settings</span>
          </Link>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
