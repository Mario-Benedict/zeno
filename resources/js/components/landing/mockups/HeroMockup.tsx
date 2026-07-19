import { useTranslation } from '@/hooks/useTranslation';
import BoardIcon from '@public/icons/large/board.svg';
import CalendarNavIcon from '@public/icons/large/calendar.svg';
import ChatNavIcon from '@public/icons/large/chat.svg';
import DashboardIcon from '@public/icons/large/dashboard.svg';
import LlmChatIcon from '@public/icons/large/llmchat.svg';
import TimelineNavIcon from '@public/icons/large/timeline.svg';
import BellIcon from '@public/icons/small/bell.svg';
import GearIcon from '@public/icons/small/gear.svg';
import PeopleIcon from '@public/icons/small/people.svg';
import SearchIcon from '@public/icons/small/search.svg';
import Logo from '@public/logos/logo.svg';
import CalendarMockup from './CalendarMockup';
import ChatMockup from './ChatMockup';
import KanbanMockup from './KanbanMockup';
import TimelineMockup from './TimelineMockup';

// The real Dashboard (Overview layout): the app top bar and sidebar, with the
// Timeline widget across the top and the Chat / Calendar / Kanban widgets below
// — the same widgets, reused, so the hero is a genuine snapshot of the app.
const HeroMockup = () => {
  const { t } = useTranslation();

  const nav = [
    { Icon: DashboardIcon, label: t('nav.dashboard'), active: true },
    { Icon: BoardIcon, label: t('nav.board'), active: false },
    { Icon: TimelineNavIcon, label: t('nav.timeline'), active: false },
    { Icon: CalendarNavIcon, label: t('nav.calendar'), active: false },
    { Icon: ChatNavIcon, label: t('nav.chat'), active: false },
    { Icon: LlmChatIcon, label: t('nav.llm'), active: false },
  ];

  return (
    <div
      className="overflow-hidden rounded-xl border border-landing-app-line bg-landing-app-1 shadow-2xl shadow-black/50"
      aria-hidden="true"
    >
      {/* Top bar */}
      <div className="flex items-center gap-2 border-b border-landing-app-line px-3 py-2 sm:gap-3">
        <Logo width={22} height={22} />
        <span className="hidden items-center gap-1 rounded-lg bg-landing-app-2 px-2 py-1 text-xsmall font-medium text-landing-app-fg sm:flex">
          {t('landing.heroMockup.projectName')}
          <span className="text-white/30">▾</span>
        </span>
        <div className="flex flex-1 items-center gap-2 rounded-lg bg-landing-app-2 px-3 py-1.5">
          <SearchIcon className="h-3.5 w-3.5 text-white/30" />
          <span className="text-xsmall text-white/30">
            {t('landing.heroMockup.searchPlaceholder')}
          </span>
        </div>
        <span className="relative flex h-7 w-7 items-center justify-center rounded-lg text-landing-app-sub">
          <BellIcon className="h-4 w-4" />
          <span className="absolute -top-0.5 -right-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-accent-red px-1 text-micro font-bold text-white">
            1
          </span>
        </span>
        <span className="hidden h-7 w-7 items-center justify-center rounded-lg text-landing-app-sub sm:flex">
          <PeopleIcon className="h-4 w-4" />
        </span>
        <span className="hidden h-7 w-7 items-center justify-center rounded-lg text-landing-app-sub sm:flex">
          <GearIcon className="h-4 w-4" />
        </span>
        <span className="flex items-center gap-1.5 rounded-lg bg-landing-app-2 px-2 py-1">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-purple text-micro font-bold text-white">
            AS
          </span>
          <span className="hidden text-xsmall font-medium text-landing-app-fg sm:inline">
            {t('landing.heroMockup.account')}
          </span>
        </span>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="hidden w-24 shrink-0 flex-col gap-0.5 border-r border-landing-app-line p-2 sm:flex">
          {nav.map(({ Icon, label, active }) => (
            <span
              key={label}
              className={`flex flex-col items-center gap-1 rounded-lg py-2 text-micro ${
                active
                  ? 'bg-accent-blue/15 text-accent-blue'
                  : 'text-landing-app-sub'
              }`}
            >
              <Icon width={18} height={18} />
              {label}
            </span>
          ))}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1 p-3">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-small font-bold text-landing-app-fg">
              {t('dashboard.title')}
            </span>
            <span className="rounded-md bg-landing-app-2 px-2 py-0.5 text-micro text-landing-app-sub">
              {t('dashboard.templateOverviewName')}
            </span>
            <span className="ml-auto text-micro text-landing-app-sub">
              {t('dashboard.changeLayout')}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <TimelineMockup className="h-36" />
            <div className="grid grid-cols-3 gap-2">
              <ChatMockup className="h-52" />
              <CalendarMockup className="h-52" />
              <KanbanMockup className="h-52" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroMockup;
