import { usePage } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import AccountSwitcher from '@/components/layouts/AccountSwitcher';
import HeaderIconButton from '@/components/layouts/HeaderIconButton';
import HeaderSearch from '@/components/layouts/HeaderSearch';
import NotificationPanel from '@/components/layouts/NotificationPanel';
import ProjectSwitcher from '@/components/layouts/ProjectSwitcher';
import ProjectInvitationModal from '@/components/projects/ProjectInvitationModal';
import echo from '@/echo';
import { useTranslation } from '@/hooks/useTranslation';
import { NOTIFICATIONS_REFRESH_EVENT } from '@/lib/notificationEvents';
import type { NotificationInboxResponse } from '@/types/reminder';
import ArrowDown from '@public/icons/small/arrow_down.svg';
import Bell from '@public/icons/small/bell.svg';
import Gear from '@public/icons/small/gear.svg';
import People from '@public/icons/small/people.svg';
import Zeno from '@public/logos/logo.svg';

interface AppHeaderProps {
  onNotificationClick?: () => void;
  onOpenSettings?: (tab?: 'general' | 'profile') => void;
}

const Header = ({ onNotificationClick, onOpenSettings }: AppHeaderProps) => {
  const { auth, project, projectNavigation, projectShare, account } =
    usePage().props;
  const { t } = useTranslation();
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationRefreshVersion, setNotificationRefreshVersion] =
    useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleNotificationDataChange = useCallback(
    (data: NotificationInboxResponse | null) => {
      if (!data) {
        setUnreadCount(0);
        return;
      }
      setUnreadCount(
        data.inbox.length + data.chat.length + data.conflicts.length,
      );
    },
    [],
  );

  const projectMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const userId = auth.user?.id;
    if (!userId) return;

    const refresh = () => {
      setNotificationRefreshVersion((version) => version + 1);
    };
    const channelName = `notifications.user.${userId}`;
    const channel = echo.private(channelName);

    channel.listen('.message.sent', refresh);
    channel.listen('.task-conflict.created', refresh);
    channel.listen('.card-assignment.created', refresh);
    window.addEventListener(NOTIFICATIONS_REFRESH_EVENT, refresh);

    return () => {
      channel.stopListening('.message.sent', refresh);
      channel.stopListening('.task-conflict.created', refresh);
      channel.stopListening('.card-assignment.created', refresh);
      echo.leave(channelName);
      window.removeEventListener(NOTIFICATIONS_REFRESH_EVENT, refresh);
    };
  }, [auth.user?.id]);

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
            aria-label={t('header.selectProject')}
            className="flex h-8 max-w-56 items-center gap-1 rounded-lg bg-static-dark-surface-2 px-2 text-static-dark-primary transition-colors hover:bg-static-dark-surface-3"
          >
            <span className="truncate text-sm font-bold whitespace-nowrap">
              {project?.project_name ?? t('header.projectsFallback')}
            </span>
            <span
              className={`shrink-0 text-static-dark-secondary transition-transform duration-150 ${projectMenuOpen ? 'rotate-180' : ''}`}
            >
              <ArrowDown />
            </span>
          </button>
          <ProjectSwitcher
            open={projectMenuOpen}
            currentProject={project}
            projects={projectNavigation.projects}
            onClose={() => setProjectMenuOpen(false)}
            onSettingsOpen={() => onOpenSettings?.('general')}
          />
        </div>
      </div>

      {/* ── Centre: Search ── */}
      <div className="flex min-w-0 flex-1 justify-center px-4" role="search">
        <HeaderSearch />
      </div>

      {/* ── Right: Actions + Account switcher ── */}
      <div className="flex w-100 shrink-0 items-center justify-end gap-2">
        <div className="relative">
          <HeaderIconButton
            label={t('header.notifications')}
            disabled={project === null}
            onClick={() => {
              onNotificationClick?.();
              setNotificationsOpen((v) => !v);
            }}
          >
            <Bell />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-red px-1 text-micro leading-none font-semibold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </HeaderIconButton>
          <NotificationPanel
            open={notificationsOpen}
            onClose={() => setNotificationsOpen(false)}
            onDataChange={handleNotificationDataChange}
            project={project}
            accountIndex={account.index}
            refreshVersion={notificationRefreshVersion}
            currentUserId={auth.user?.id ?? 0}
          />
        </div>
        <HeaderIconButton
          label={t('header.inviteMembers')}
          disabled={project === null}
          onClick={() => setInviteOpen(true)}
        >
          <People />
        </HeaderIconButton>
        <HeaderIconButton
          label={t('header.settings')}
          onClick={() => onOpenSettings?.('general')}
        >
          <Gear />
        </HeaderIconButton>

        <div className="mx-1.5 h-5 w-px bg-dark-border" aria-hidden="true" />

        {/* AccountSwitcher manages its own open state + outside-click */}
        <AccountSwitcher
          onOpen={() => setProjectMenuOpen(false)}
          onSettingsOpen={() => onOpenSettings?.('profile')}
        />
      </div>

      <ProjectInvitationModal
        open={inviteOpen}
        project={project}
        share={projectShare}
        onClose={() => setInviteOpen(false)}
      />
    </header>
  );
};

export default Header;
