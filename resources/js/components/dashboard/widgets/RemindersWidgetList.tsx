import { useState } from 'react';
import { PinIcon } from '@/components/shared/PinButton';
import { useTranslation } from '@/hooks/useTranslation';
import type { Reminder } from '@/types/reminder';
import {
  formatReminderListDate,
  isReminderDueSoon,
  isReminderOverdue,
} from '@/utils/reminders';
import ArrowDownIcon from '@public/icons/small/arrow_down.svg';
import CheckIcon from '@public/icons/small/check.svg';

interface Props {
  reminders: Reminder[];
  onToggleComplete: (reminder: Reminder) => void;
  onSelectReminder: (reminder: Reminder) => void;
}

const ReminderRow = ({
  reminder,
  onToggleComplete,
  onSelectReminder,
  localeCode,
}: {
  reminder: Reminder;
  onToggleComplete: (reminder: Reminder) => void;
  onSelectReminder: (reminder: Reminder) => void;
  localeCode: string;
}) => {
  const { t } = useTranslation();
  const overdue =
    !reminder.is_completed && isReminderOverdue(reminder.reminder_due_at);
  const dueSoon =
    !reminder.is_completed && isReminderDueSoon(reminder.reminder_due_at);

  return (
    <div className="flex items-start gap-2.5 rounded-lg bg-dark-surface-3 px-3 py-2 transition hover:bg-white/10">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
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
                ? 'text-white/30 line-through'
                : 'text-white/90'
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
                  : 'text-white/40'
            }`}
          >
            {formatReminderListDate(reminder.reminder_due_at, localeCode)}
          </p>
        )}
      </button>
    </div>
  );
};

export const RemindersWidgetList = ({
  reminders,
  onToggleComplete,
  onSelectReminder,
}: Props) => {
  const { t, locale } = useTranslation();
  const localeCode = locale === 'id' ? 'id-ID' : 'en-US';
  const [completedOpen, setCompletedOpen] = useState(false);

  const active = reminders.filter((r) => !r.is_completed);
  const completed = reminders.filter((r) => r.is_completed);

  return (
    <div className="scrollbar-app flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto px-3 pb-3">
      {reminders.length === 0 ? (
        <p className="px-1 py-6 text-center text-xsmall text-white/30">
          {t('reminders.noRemindersYet')}
        </p>
      ) : (
        <>
          {active.map((reminder) => (
            <ReminderRow
              key={reminder.reminder_id}
              reminder={reminder}
              onToggleComplete={onToggleComplete}
              onSelectReminder={onSelectReminder}
              localeCode={localeCode}
            />
          ))}

          {completed.length > 0 && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setCompletedOpen((v) => !v)}
                className="mb-1.5 flex w-full items-center gap-1.5 rounded-lg bg-dark-surface-3/60 px-3 py-1.5 text-xsmall font-medium text-white/50 transition hover:bg-dark-surface-3"
              >
                <ArrowDownIcon
                  className={`h-3 w-3 transition-transform ${
                    completedOpen ? '' : '-rotate-90'
                  }`}
                />
                {t('reminders.completedCount', { count: completed.length })}
              </button>

              {completedOpen && (
                <div className="flex flex-col gap-1.5">
                  {completed.map((reminder) => (
                    <ReminderRow
                      key={reminder.reminder_id}
                      reminder={reminder}
                      onToggleComplete={onToggleComplete}
                      onSelectReminder={onSelectReminder}
                      localeCode={localeCode}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
