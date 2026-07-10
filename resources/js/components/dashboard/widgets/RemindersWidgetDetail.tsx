import { useTranslation } from '@/hooks/useTranslation';
import type { Reminder } from '@/types/reminder';
import { formatReminderDetailDateTime } from '@/utils/reminders';
import CloseIcon from '@public/icons/small/cancel.svg';
import CheckIcon from '@public/icons/small/check.svg';

interface Props {
  reminder: Reminder;
  onClose: () => void;
  onToggleComplete: (reminder: Reminder) => void;
}

/**
 * Read-only reminder detail popup — same convention as
 * KanbanWidgetCardDetail/CalendarWidgetEventDetail: shows everything (due
 * date, description, steps) but nothing here is clickable or editable
 * beyond the reminder's own "mark as done", which is also available from
 * the list. No alarm/notification affordance — the widget is view-only.
 */
export const RemindersWidgetDetail = ({
  reminder,
  onClose,
  onToggleComplete,
}: Props) => {
  const { t, locale } = useTranslation();
  const localeCode = locale === 'id' ? 'id-ID' : 'en-US';

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
          <button
            type="button"
            onClick={() => onToggleComplete(reminder)}
            aria-label={
              reminder.is_completed
                ? t('reminders.markAsNotDone')
                : t('reminders.markAsDone')
            }
            className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
              reminder.is_completed
                ? 'border-accent-blue bg-accent-blue'
                : 'border-dark-secondary hover:border-dark-primary'
            }`}
          >
            {reminder.is_completed && (
              <CheckIcon className="h-2 w-2 text-dark-primary" />
            )}
          </button>

          <p
            className={`flex-1 text-small leading-snug font-semibold ${
              reminder.is_completed
                ? 'text-white/40 line-through'
                : 'text-white'
            }`}
          >
            {reminder.reminder_title}
          </p>

          <button
            type="button"
            onClick={onClose}
            aria-label={t('reminders.close')}
            className="shrink-0 rounded-lg p-1 text-dark-secondary transition hover:bg-dark-surface-3 hover:text-white"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-3 text-micro text-white/40">
          {formatReminderDetailDateTime(
            reminder.reminder_due_at,
            localeCode,
            t('reminders.noDueDate'),
          )}
        </p>

        {reminder.reminder_description && (
          <p className="mb-3 text-xsmall whitespace-pre-wrap text-white/60">
            {reminder.reminder_description}
          </p>
        )}

        {!!reminder.steps?.length && (
          <div>
            <p className="mb-1.5 text-micro text-white/40">
              {t('reminders.steps')}
            </p>
            <div className="space-y-1">
              {reminder.steps
                .slice()
                .sort((a, b) => a.position - b.position)
                .map((step) => (
                  <div
                    key={step.reminder_step_id}
                    className="flex items-center gap-2"
                  >
                    <span
                      className={`flex h-3 w-3 shrink-0 items-center justify-center rounded-sm border ${
                        step.is_completed
                          ? 'border-accent-blue bg-accent-blue'
                          : 'border-white/25'
                      }`}
                    >
                      {step.is_completed && (
                        <CheckIcon className="h-2 w-2 text-white" />
                      )}
                    </span>
                    <span
                      className={`text-xsmall ${
                        step.is_completed
                          ? 'text-white/30 line-through'
                          : 'text-white/70'
                      }`}
                    >
                      {step.reminder_step_name}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
