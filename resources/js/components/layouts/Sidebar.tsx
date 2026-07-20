import { Link, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import type { TranslationKey } from '@/i18n/dictionary';
import { projectPath } from '@/lib/accountRoutes';

import BoardIcon from '@public/icons/large/board.svg';
import CalendarIcon from '@public/icons/large/calendar.svg';
import ChatIcon from '@public/icons/large/chat.svg';
import DashboardIcon from '@public/icons/large/dashboard.svg';
import LLMIcon from '@public/icons/large/llmchat.svg';
import MoreIcon from '@public/icons/large/more.svg';
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

const PRIMARY_NAV_KEYS = new Set([
  'dashboard',
  'board',
  'chat',
  'llm',
  'notes',
]);

const Sidebar = ({ projectSlug }: SidebarProps) => {
  const { t } = useTranslation();
  const page = usePage();
  const { url } = page;
  const accountIndex = page.props.account.index;
  const navItems = buildNavItems(accountIndex, projectSlug);
  const primaryItems = navItems.filter((item) =>
    PRIMARY_NAV_KEYS.has(item.key),
  );
  const moreItems = navItems.filter((item) => !PRIMARY_NAV_KEYS.has(item.key));
  const projectHome = projectPath(accountIndex, projectSlug);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  const isActive = (href: string) => {
    if (href === projectHome) return url === href;
    return url.startsWith(href);
  };

  const activeMoreItem = moreItems.find((item) => isActive(item.href));
  const visibleItems = activeMoreItem
    ? [...primaryItems, activeMoreItem]
    : primaryItems;

  useEffect(() => {
    if (!moreOpen) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!moreRef.current?.contains(event.target as Node)) setMoreOpen(false);
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, [moreOpen]);

  return (
    <aside className="flex h-[calc(100dvh-var(--header-height))] flex-col bg-dark-surface-1 px-2 pb-2">
      <nav className="flex h-full flex-col rounded-lg bg-dark-surface-2 p-2">
        <div className="flex flex-1 [scrollbar-width:none] flex-col items-center gap-0.5 overflow-x-hidden overflow-y-auto py-1 pr-0.5 [&::-webkit-scrollbar]:hidden">
          {visibleItems.map(({ key, nameKey, href, icon: Icon }) => {
            const active = isActive(href);

            return (
              <Link
                key={key}
                href={href}
                className={`group flex w-full flex-col items-center justify-center gap-2 py-2 text-micro leading-none font-medium transition-colors duration-150 ${
                  active
                    ? 'text-dark-primary'
                    : 'text-dark-secondary hover:text-dark-primary'
                }`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-150 ${
                    active
                      ? 'bg-accent-blue text-white shadow-[0_0_18px] shadow-accent-blue/45'
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

        <div ref={moreRef} className="relative w-full pt-1">
          {moreOpen && (
            <div className="absolute bottom-0 left-full z-40 ml-3 w-52 overflow-hidden rounded-xl border border-dark-border bg-dark-surface-2 p-1.5 shadow-2xl">
              <p className="px-2.5 py-2 text-micro font-semibold tracking-wider text-dark-secondary uppercase">
                {t('nav.more')}
              </p>
              {moreItems.map(({ key, nameKey, href, icon: Icon }) => {
                const active = isActive(href);

                return (
                  <Link
                    key={key}
                    href={href}
                    onClick={() => setMoreOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-2.5 py-2 text-xsmall font-semibold transition ${
                      active
                        ? 'bg-accent-blue/15 text-dark-primary'
                        : 'text-dark-secondary hover:bg-dark-surface-3 hover:text-dark-primary'
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        active
                          ? 'bg-accent-blue text-white'
                          : 'bg-dark-surface-3'
                      }`}
                    >
                      <Icon />
                    </span>
                    <span className="min-w-0 flex-1 truncate">
                      {t(nameKey)}
                    </span>
                    {active && (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-accent-blue" />
                    )}
                  </Link>
                );
              })}
            </div>
          )}

          <button
            type="button"
            aria-expanded={moreOpen}
            aria-haspopup="menu"
            onClick={() => setMoreOpen((open) => !open)}
            className={`group flex w-full flex-col items-center justify-center gap-2 py-2 text-micro leading-none font-medium transition-colors duration-150 ${
              moreOpen
                ? 'text-dark-primary'
                : 'text-dark-secondary hover:text-dark-primary'
            }`}
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors duration-150 ${
                moreOpen ? 'bg-dark-surface-3' : 'group-hover:bg-dark-surface-3'
              }`}
            >
              <MoreIcon />
            </div>
            <span>{t('nav.more')}</span>
          </button>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
