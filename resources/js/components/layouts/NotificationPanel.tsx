import { Link, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { projectPath } from '@/lib/accountRoutes';
import { inertiaJson } from '@/lib/inertiaJson';
import notifications from '@/routes/notifications';
import taskConflicts from '@/routes/task-conflicts';
import type { CurrentProject, NotificationInboxResponse } from '@/types';
import { initials } from '@/utils/chat';
import { formatReminderListDate } from '@/utils/reminders';

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
  project: CurrentProject | null;
  accountIndex: number;
  refreshVersion?: number;
  onDataChange?: (data: NotificationInboxResponse | null) => void;
  currentUserId: number;
}

type Tab = 'inbox' | 'chat' | 'conflicts';

const NotificationPanel = ({
  open,
  onClose,
  project,
  accountIndex,
  refreshVersion = 0,
  onDataChange,
  currentUserId,
}: NotificationPanelProps) => {
  const { locale, t } = useTranslation();
  const localeCode = locale === 'id' ? 'id-ID' : 'en-US';
  const [tab, setTab] = useState<Tab>('inbox');
  const [data, setData] = useState<NotificationInboxResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);

  useEffect(() => {
    if (!project) return;

    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(true);
    }
    inertiaJson<NotificationInboxResponse>(
      'get',
      notifications.index.url({ accountIndex, project: project.project_slug }),
    )
      .then((json: NotificationInboxResponse) => {
        setData(json);
        onDataChange?.(json);
      })
      .catch((err: unknown) =>
        console.error('Failed to load notifications', err),
      )
      .finally(() => {
        if (open) setLoading(false);
      });
  }, [open, project, accountIndex, refreshVersion, onDataChange]);

  const removeConflict = (id: string) => {
    setData((prev) =>
      prev
        ? { ...prev, conflicts: prev.conflicts.filter((c) => c.id !== id) }
        : prev,
    );
  };

  const respondToConflict = (id: string, canDoBoth: boolean) => {
    removeConflict(id);
    router.patch(
      taskConflicts.respond.url({ accountIndex, taskConflict: id }),
      { can_do_both: canDoBoth },
      { preserveScroll: true, preserveState: true },
    );
  };

  const acknowledgeConflict = (id: string) => {
    removeConflict(id);
    router.patch(
      taskConflicts.acknowledge.url({ accountIndex, taskConflict: id }),
      {},
      { preserveScroll: true, preserveState: true },
    );
  };

  if (!open || !project) return null;

  return (
    <div
      ref={ref}
      className="absolute top-full right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-dark-border bg-dark-surface-1 shadow-2xl"
    >
      <div className="flex border-b border-dark-border">
        <button
          type="button"
          onClick={() => setTab('inbox')}
          className={`flex-1 py-3 text-small font-semibold transition-colors ${
            tab === 'inbox'
              ? 'border-b-2 border-accent-blue text-dark-primary'
              : 'text-dark-secondary hover:text-dark-primary'
          }`}
        >
          {t('header.inbox')}
        </button>
        <button
          type="button"
          onClick={() => setTab('chat')}
          className={`flex-1 py-3 text-small font-semibold transition-colors ${
            tab === 'chat'
              ? 'border-b-2 border-accent-blue text-dark-primary'
              : 'text-dark-secondary hover:text-dark-primary'
          }`}
        >
          {t('header.chat')}
        </button>
        <button
          type="button"
          onClick={() => setTab('conflicts')}
          className={`relative flex-1 py-3 text-small font-semibold transition-colors ${
            tab === 'conflicts'
              ? 'border-b-2 border-accent-blue text-dark-primary'
              : 'text-dark-secondary hover:text-dark-primary'
          }`}
        >
          {t('header.conflicts')}
          {(data?.conflicts.length ?? 0) > 0 && (
            <span className="absolute top-2 right-4 h-1.5 w-1.5 rounded-full bg-accent-red" />
          )}
        </button>
      </div>

      <div className="scrollbar-app max-h-96 overflow-y-auto p-2">
        {loading && (
          <p className="py-8 text-center text-xsmall text-dark-secondary/70">
            {t('common.loading')}
          </p>
        )}

        {!loading && tab === 'inbox' && (
          <>
            {(data?.inbox.length ?? 0) === 0 && (
              <p className="py-8 text-center text-xsmall text-dark-secondary/70">
                {t('header.nothingDueSoon')}
              </p>
            )}
            {data?.inbox.map((item) =>
              item.type === 'assignment' ? (
                <Link
                  key={item.id}
                  as="button"
                  method="post"
                  href={projectPath(
                    accountIndex,
                    project.project_slug,
                    `/notifications/assignments/${item.id}/open`,
                  )}
                  onClick={onClose}
                  className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-dark-surface-3"
                >
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent-blue" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-small text-dark-primary">
                      {t('header.assignedToCard', {
                        card: item.card_title ?? '',
                      })}
                    </p>
                  </div>
                </Link>
              ) : (
                <Link
                  key={item.reminder_id}
                  as="button"
                  method="post"
                  href={projectPath(
                    accountIndex,
                    project.project_slug,
                    `/notifications/reminders/${item.reminder_id}/open`,
                  )}
                  onClick={onClose}
                  className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-dark-surface-3"
                >
                  <span
                    className={`mt-1 h-2 w-2 shrink-0 rounded-full ${item.is_overdue ? 'bg-accent-red' : 'bg-accent-yellow'}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-small text-dark-primary">
                      {item.title}
                    </p>
                    <p
                      className={`text-xsmall ${item.is_overdue ? 'text-accent-red' : 'text-dark-secondary'}`}
                    >
                      {item.is_overdue
                        ? t('header.overduePrefix')
                        : t('header.duePrefix')}
                      {formatReminderListDate(item.due_at, localeCode)}
                    </p>
                  </div>
                </Link>
              ),
            )}
          </>
        )}

        {!loading && tab === 'chat' && (
          <>
            {(data?.chat.length ?? 0) === 0 && (
              <p className="py-8 text-center text-xsmall text-dark-secondary/70">
                {t('header.noUnreadMessages')}
              </p>
            )}
            {data?.chat.map((room) => {
              const label =
                room.type === 'group'
                  ? (room.name ?? t('header.groupFallback'))
                  : (room.participants.find(
                      (p) => String(p.id) !== String(currentUserId),
                    )?.name ?? t('header.directMessageFallback'));
              const preview = room.lastMessage
                ? room.type === 'group'
                  ? `${room.lastMessage.senderName}: ${room.lastMessage.body}`
                  : room.lastMessage.body
                : null;

              return (
                <Link
                  key={room.id}
                  href={`${projectPath(accountIndex, project.project_slug, '/chat')}?room=${room.id}`}
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition hover:bg-dark-surface-3"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-blue text-xsmall font-bold text-white">
                    {initials(label)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-small text-dark-primary">
                      {label}
                    </p>
                    {preview && (
                      <p className="mt-0.5 truncate text-xsmall text-dark-secondary">
                        {preview}
                      </p>
                    )}
                  </div>
                  <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-accent-blue px-1.5 text-micro font-semibold text-white">
                    {room.unread_count}
                  </span>
                </Link>
              );
            })}
          </>
        )}

        {!loading && tab === 'conflicts' && (
          <>
            {(data?.conflicts.length ?? 0) === 0 && (
              <p className="py-8 text-center text-xsmall text-dark-secondary/70">
                {t('header.noConflicts')}
              </p>
            )}
            {data?.conflicts.map((c) =>
              c.role === 'assignee' ? (
                <div
                  key={c.id}
                  className="rounded-lg px-3 py-2.5 hover:bg-dark-surface-3"
                >
                  <p className="text-small text-dark-primary">
                    {t('header.conflictAssigneePrompt', {
                      card: c.card_title ?? '',
                      other: c.conflicting_title,
                    })}
                  </p>
                  <p className="mt-0.5 text-xsmall text-dark-secondary">
                    {formatReminderListDate(c.conflicting_start, localeCode)}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => respondToConflict(c.id, true)}
                      className="hover:bg-opacity-90 rounded-lg bg-accent-blue px-3 py-1 text-xsmall font-semibold text-white transition"
                    >
                      {t('common.yes')}
                    </button>
                    <button
                      type="button"
                      onClick={() => respondToConflict(c.id, false)}
                      className="rounded-lg border border-dark-border px-3 py-1 text-xsmall text-dark-secondary transition hover:text-dark-primary"
                    >
                      {t('common.no')}
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  key={c.id}
                  className="rounded-lg px-3 py-2.5 hover:bg-dark-surface-3"
                >
                  <p className="text-small text-dark-primary">
                    {t('header.conflictAssignerAlert', {
                      name: c.assignee_name ?? '',
                      card: c.card_title ?? '',
                    })}
                  </p>
                  <button
                    type="button"
                    onClick={() => acknowledgeConflict(c.id)}
                    className="mt-2 rounded-lg border border-dark-border px-3 py-1 text-xsmall text-dark-secondary transition hover:text-dark-primary"
                  >
                    {t('common.ok')}
                  </button>
                </div>
              ),
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;
