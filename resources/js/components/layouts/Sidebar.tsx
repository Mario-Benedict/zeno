import { Link, usePage } from '@inertiajs/react';
import { useTranslation } from '@/hooks/useTranslation';
import type { TranslationKey } from '@/i18n/dictionary';
import { projectPath } from '@/lib/accountRoutes';

import BoardIcon from '@public/icons/large/board.svg';
import CalendarIcon from '@public/icons/large/calendar.svg';
import ChatIcon from '@public/icons/large/chat.svg';
import DashboardIcon from '@public/icons/large/dashboard.svg';
import LLMIcon from '@public/icons/large/llmchat.svg';
import NotesIcon from '@public/icons/large/notes.svg';
import RemindersIcon from '@public/icons/large/reminder.svg';
import TimelineIcon from '@public/icons/large/timeline.svg';

interface NavItem {
  key: string;
  nameKey: TranslationKey;
  href: string;
  icon: React.FC;
}

const buildNavItems = (
  accountIndex: number,
  projectSlug: string,
): NavItem[] => [
  {
    key: 'dashboard',
    nameKey: 'nav.dashboard',
    href: projectPath(accountIndex, projectSlug, '/dashboard'),
    icon: DashboardIcon,
  },
  {
    key: 'board',
    nameKey: 'nav.board',
    href: projectPath(accountIndex, projectSlug, '/kanban'),
    icon: BoardIcon,
  },
  {
    key: 'timeline',
    nameKey: 'nav.timeline',
    href: projectPath(accountIndex, projectSlug, '/timeline'),
    icon: TimelineIcon,
  },
  {
    key: 'calendar',
    nameKey: 'nav.calendar',
    href: projectPath(accountIndex, projectSlug, '/calendar'),
    icon: CalendarIcon,
  },
  {
    key: 'chat',
    nameKey: 'nav.chat',
    href: projectPath(accountIndex, projectSlug, '/chat'),
    icon: ChatIcon,
  },
  {
    key: 'llm',
    nameKey: 'nav.llm',
    href: projectPath(accountIndex, projectSlug, '/llm-chat'),
    icon: LLMIcon,
  },
  {
    key: 'notes',
    nameKey: 'nav.notes',
    href: projectPath(accountIndex, projectSlug, '/notes'),
    icon: NotesIcon,
  },
  {
    key: 'reminders',
    nameKey: 'nav.reminders',
    href: projectPath(accountIndex, projectSlug, '/reminders'),
    icon: RemindersIcon,
  },
];

interface SidebarProps {
  projectSlug: string;
}

const Sidebar = ({ projectSlug }: SidebarProps) => {
  const { t } = useTranslation();
  const page = usePage();
  const { url } = page;
  const accountIndex = page.props.account.index;
  const navItems = buildNavItems(accountIndex, projectSlug);
  const projectHome = projectPath(accountIndex, projectSlug);

  const isActive = (href: string) => {
    if (href === projectHome) return url === href;
    return url.startsWith(href);
  };

  return (
    <aside className="flex h-[calc(100dvh-var(--header-height))] flex-col bg-dark-surface-1 px-2 pb-2">
      <nav className="flex h-full flex-col rounded-lg bg-dark-surface-2 p-2">
        <div className="flex flex-1 [scrollbar-width:none] flex-col items-center gap-0.5 overflow-x-hidden overflow-y-auto py-1 pr-0.5 [&::-webkit-scrollbar]:hidden">
          {navItems.map(({ key, nameKey, href, icon: Icon }) => {
            const active = isActive(href);

            return (
              <Link
                key={key}
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
                <span>{t(nameKey)}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
