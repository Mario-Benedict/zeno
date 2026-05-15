import { Link, usePage } from '@inertiajs/react';

interface NavItem {
  name: string;
  href: string;
  icon: React.FC;
}

const DashboardIcon: React.FC = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

const BoardIcon: React.FC = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="5" height="18" rx="1.5" />
    <rect x="10" y="3" width="5" height="12" rx="1.5" />
    <rect x="17" y="3" width="5" height="15" rx="1.5" />
  </svg>
);

const ChatIcon: React.FC = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const LLMIcon: React.FC = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
  </svg>
);

const NotesIcon: React.FC = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="8" y1="13" x2="16" y2="13" />
    <line x1="8" y1="17" x2="12" y2="17" />
  </svg>
);

const RemindersIcon: React.FC = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const SettingsIcon: React.FC = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const buildNavItems = (projectSlug: string): NavItem[] => [
  { name: 'Overview', href: `/p/${projectSlug}`, icon: DashboardIcon },
  { name: 'Board', href: `/p/${projectSlug}/board`, icon: BoardIcon },
  { name: 'Chat', href: `/p/${projectSlug}/chat`, icon: ChatIcon },
  { name: 'LLM', href: `/p/${projectSlug}/llm`, icon: LLMIcon },
  { name: 'Notes', href: `/p/${projectSlug}/notes`, icon: NotesIcon },
  { name: 'Reminders', href: `/p/${projectSlug}/reminders`, icon: RemindersIcon },
];

const navLinkBase =
  'flex w-14 flex-col items-center justify-center gap-1.5 rounded-xl px-1.5 py-2.5 text-[10px] font-medium leading-none transition-colors duration-150';
const navLinkActive = 'bg-accent-blue text-white hover:bg-accent-blue/90';
const navLinkIdle = 'text-dark-secondary hover:bg-white/[0.07] hover:text-dark-primary';

interface SidebarProps {
  projectSlug: string;
}

const Sidebar = ({ projectSlug }: SidebarProps) => {
  const { url } = usePage();
  const navItems = buildNavItems(projectSlug);

  const isActive = (href: string) => {
    if (href === `/p/${projectSlug}`) return url === href;
    return url.startsWith(href);
  };

  return (
    <aside className="flex h-dvh flex-col border-r border-dark-border bg-dark-surface-1 px-3">
      <nav className="flex flex-col py-3">
        <div className="flex flex-1 flex-col items-center gap-0.5 overflow-y-auto overflow-x-hidden py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {navItems.map(({ name, href, icon: Icon }) => (
            <Link
              key={name}
              href={href}
              className={`${navLinkBase} ${isActive(href) ? navLinkActive : navLinkIdle}`}
            >
              <Icon />
              <span>{name}</span>
            </Link>
          ))}
        </div>
        <div className="flex flex-col items-center pb-1">
          <div className="my-2 h-px w-10 bg-dark-border" />
          <Link
            href={`/p/${projectSlug}/settings`}
            className={`${navLinkBase} ${url.startsWith(`/p/${projectSlug}/settings`) ? navLinkActive : navLinkIdle}`}
          >
            <SettingsIcon />
            <span>Settings</span>
          </Link>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
