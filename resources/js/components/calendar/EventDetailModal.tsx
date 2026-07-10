import { Link } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { TagBadge } from '@/components/kanban';
import { useTranslation } from '@/hooks/useTranslation';
import { projectPath } from '@/lib/accountRoutes';
import type {
  AnyCalendarEvent,
  CalendarEventFull,
  CalendarMember,
} from '@/types/calendar';
import { getRecurrenceLabel } from '@/utils/calendar';
import BoardIcon from '@public/icons/large/board.svg';

interface EventDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: AnyCalendarEvent | null;
  members: CalendarMember[];
  onEdit: () => void;
  onDelete: () => void;
  canEdit: boolean;
  accountIndex: number;
  projectSlug: string;
}

export const EventDetailModal = ({
  isOpen,
  onClose,
  event,
  members,
  onEdit,
  onDelete,
  canEdit,
  accountIndex,
  projectSlug,
}: EventDetailModalProps) => {
  const { t, locale } = useTranslation();
  const localeCode = locale === 'id' ? 'id-ID' : 'en-US';
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen || !event) return null;

  if (event.is_classified) {
    return (
      <div
        ref={modalRef}
        className="fixed top-1/2 left-1/2 z-[60] w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-dark-border bg-dark-surface-1 p-6 text-center shadow-2xl ring-1 ring-dark-border/50"
      >
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-dark-surface-3">
          <svg
            className="h-6 w-6 text-dark-secondary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7z"
            />
          </svg>
        </div>
        <h3 className="mb-2 text-medium font-semibold text-dark-primary">
          {t('calendar.privateSchedule')}
        </h3>
        <p className="mb-6 text-small text-dark-secondary">
          {t('calendar.privateScheduleDescription')}
        </p>
        <button
          onClick={onClose}
          className="w-full rounded-lg bg-dark-surface-3 px-4 py-2 text-small font-medium text-dark-primary transition hover:bg-dark-border"
        >
          {t('calendar.close')}
        </button>
      </div>
    );
  }

  // Narrow before the CalendarEventFull cast below, which would otherwise
  // erase the CalendarKanbanTask-only fields (kanban_board_id / _name).
  const kanbanTask = event.is_kanban_task ? event : null;
  const kanbanBoardUrl = kanbanTask
    ? projectPath(accountIndex, projectSlug, '/kanban')
    : null;

  const fullEvent = event as CalendarEventFull;

  const start = new Date(fullEvent.start_time);
  const end = new Date(fullEvent.end_time);

  const dateStr = start.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const timeStr = `${start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - ${end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;

  const recurrenceLabel =
    fullEvent.recurrence !== 'none'
      ? getRecurrenceLabel(
          fullEvent.recurrence,
          start,
          fullEvent.recurrence_end_date,
          localeCode,
          t,
        )
      : null;

  return (
    <div
      ref={modalRef}
      className="fixed top-1/2 left-1/2 z-[60] w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-dark-border bg-dark-surface-1 shadow-2xl ring-1 ring-dark-border/50"
    >
      <div className="flex items-start justify-between border-b border-dark-border px-5 py-4">
        <div className="pr-4">
          <h2
            className={`text-large font-semibold text-dark-primary ${kanbanTask?.is_completed ? 'text-dark-secondary line-through' : ''}`}
          >
            {fullEvent.title}
          </h2>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xsmall text-dark-secondary">
            {kanbanTask && (
              <span className="flex items-center gap-1 font-medium">
                <BoardIcon className="h-3 w-3" />
                {t('calendar.fromBoard', {
                  board: kanbanTask.kanban_board_name,
                })}
              </span>
            )}
            {fullEvent.labels.map((label) => (
              <TagBadge
                key={label.card_label_id}
                label={label.card_label_name}
                colorHex={label.card_label_color_hex}
              />
            ))}
            {recurrenceLabel && (
              <>
                <span>•</span>
                <span>{recurrenceLabel}</span>
              </>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label={t('calendar.close')}
          className="shrink-0 text-dark-secondary hover:text-dark-primary"
        >
          ✕
        </button>
      </div>

      <div className="p-5">
        <div className="mb-4 flex items-center gap-3 text-small text-dark-primary">
          <svg
            className="h-4 w-4 text-dark-secondary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p>{dateStr}</p>
            <p className="text-dark-secondary">{timeStr}</p>
          </div>
        </div>

        <div className="mb-4 flex items-center gap-3 text-small text-dark-primary">
          <svg
            className="h-4 w-4 text-dark-secondary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <span
            className="h-3 w-3 shrink-0 rounded-full ring-1 ring-black/20"
            style={{
              backgroundColor:
                members.find((m) => m.id === fullEvent.participants[0]?.id)
                  ?.color ?? '#7B7B7B',
            }}
          />
          <span>
            {fullEvent.participants[0]?.name || t('calendar.unknownMember')}
          </span>
        </div>

        {fullEvent.description && (
          <div className="mt-4 mb-6 rounded-lg bg-dark-surface-2 p-3 text-small text-dark-primary">
            <p className="leading-relaxed whitespace-pre-wrap">
              {fullEvent.description}
            </p>
          </div>
        )}

        {kanbanTask && (
          <div className="mt-6 flex justify-end border-t border-dark-border pt-4">
            <Link
              href={kanbanBoardUrl!}
              className="rounded-lg bg-dark-surface-3 px-4 py-2 text-small font-medium text-dark-primary transition hover:bg-dark-border"
            >
              {t('calendar.openInBoard')}
            </Link>
          </div>
        )}

        {canEdit && (
          <div className="mt-6 flex justify-end gap-3 border-t border-dark-border pt-4">
            <button
              onClick={onDelete}
              className="rounded-lg px-4 py-2 text-small font-medium text-status-error transition hover:bg-status-error/10"
            >
              {t('calendar.delete')}
            </button>
            <button
              onClick={onEdit}
              className="rounded-lg bg-dark-surface-3 px-4 py-2 text-small font-medium text-dark-primary transition hover:bg-dark-border"
            >
              {t('calendar.edit')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
