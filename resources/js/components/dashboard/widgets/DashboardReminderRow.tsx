import PinIcon from '@/components/shared/PinIcon';
import { useTranslation } from '@/hooks/useTranslation';
import type { Reminder } from '@/types/reminder';
import {
  formatReminderListDate,
  isReminderDueSoon,
  isReminderOverdue,
} from '@/utils/reminders';
import CheckIcon from '@public/icons/small/check.svg';

interface Props {
  reminder: Reminder;
  onToggleComplete: (reminder: Reminder) => void;
  onSelectReminder: (reminder: Reminder) => void;
  localeCode: string;
}

const DashboardReminderRow = ({
  reminder,
  onToggleComplete,
  onSelectReminder,
  localeCode,
}: Props) => {
  const { t } = useTranslation();
  const overdue =
    !reminder.is_completed && isReminderOverdue(reminder.reminder_due_at);
  const dueSoon =
    !reminder.is_completed && isReminderDueSoon(reminder.reminder_due_at);

  return (
    <div className="flex items-start gap-2.5 rounded-lg bg-dark-surface-3 px-3 py-2 transition hover:bg-dark-surface-3">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onToggleComplete(reminder);
        }}
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
          <CheckIcon className="h-2.5 w-2.5 text-dark-primary" />
        )}
      </button>

      <button
        type="button"
        onClick={() => onSelectReminder(reminder)}
        className="min-w-0 flex-1 text-left"
      >
        <span className="flex items-center gap-1.5">
          <p
            className={`truncate text-small font-medium ${
              reminder.is_completed
                ? 'text-dark-secondary/80 line-through'
                : 'text-dark-primary'
            }`}
          >
            {reminder.reminder_title}
          </p>
          {reminder.is_pinned && (
            <span className="shrink-0">
              <PinIcon filled />
            </span>
          )}
        </span>
        {reminder.reminder_due_at && (
          <p
            className={`text-xsmall ${
              overdue
                ? 'text-accent-red'
                : dueSoon
                  ? 'text-accent-yellow'
                  : 'text-dark-secondary'
            }`}
          >
            {formatReminderListDate(reminder.reminder_due_at, localeCode)}
          </p>
        )}
      </button>
    </div>
  );
};

export default DashboardReminderRow;
