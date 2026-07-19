import { useTranslation } from '@/hooks/useTranslation';
import type { CalendarEventFull, CalendarKanbanTask } from '@/types/calendar';
import {
  getEventLabelColor,
  getRecurrenceShortLabelKey,
} from '@/utils/calendar';
import { getContrastColor } from '@/utils/kanban';
import CloseIcon from '@public/icons/small/cancel.svg';

interface Props {
  event: CalendarEventFull | CalendarKanbanTask;
  onClose: () => void;
}

/**
 * Read-only event detail popup — same "no editing affordances" convention
 * as KanbanWidgetCardDetail: shows title, time, description, labels, and
 * participants, but nothing here is clickable or editable.
 */
export const CalendarWidgetEventDetail = ({ event, onClose }: Props) => {
  const { t, locale } = useTranslation();
  const localeCode = locale === 'id' ? 'id-ID' : 'en-US';

  const dateLabel = new Intl.DateTimeFormat(localeCode, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date(event.start_time));

  const timeLabel = event.is_kanban_task
    ? t('dashboard.dueDate', {
        date: new Date(event.start_time).toLocaleTimeString(localeCode, {
          hour: '2-digit',
          minute: '2-digit',
        }),
      })
    : `${new Date(event.start_time).toLocaleTimeString(localeCode, { hour: '2-digit', minute: '2-digit' })} – ${new Date(
        event.end_time,
      ).toLocaleTimeString(localeCode, {
        hour: '2-digit',
        minute: '2-digit',
      })}`;

  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="scrollbar-app max-h-full w-full max-w-sm overflow-y-auto rounded-2xl bg-dark-surface-2 p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start gap-2.5">
          <span
            className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: getEventLabelColor(event.labels) }}
          />
          <p className="flex-1 text-small leading-snug font-semibold text-dark-primary">
            {event.title}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('calendar.close')}
            className="shrink-0 rounded-lg p-1 text-dark-secondary transition hover:bg-dark-surface-3 hover:text-dark-primary"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-3 text-micro text-dark-secondary">
          {dateLabel} · {timeLabel}
          {!event.is_kanban_task && event.recurrence !== 'none' && (
            <> · {t(getRecurrenceShortLabelKey(event.recurrence))}</>
          )}
        </p>

        {event.is_kanban_task && (
          <p className="mb-3 text-micro text-dark-secondary">
            {t('calendar.fromBoard', { board: event.kanban_board_name })}
          </p>
        )}

        {event.description && (
          <p className="mb-3 text-xsmall whitespace-pre-wrap text-dark-secondary">
            {event.description}
          </p>
        )}

        {!!event.labels.length && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {event.labels.map((label) => (
              <span
                key={label.card_label_id}
                className="rounded-full px-2 py-0.5 text-micro font-semibold"
                style={{
                  backgroundColor: label.card_label_color_hex,
                  color: getContrastColor(label.card_label_color_hex),
                }}
              >
                {label.card_label_name}
              </span>
            ))}
          </div>
        )}

        {!!event.participants.length && (
          <p className="text-micro text-dark-secondary">
            {event.participants.map((p) => p.name).join(', ')}
          </p>
        )}
      </div>
    </div>
  );
};
