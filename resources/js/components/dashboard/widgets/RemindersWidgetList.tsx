import { useState } from 'react';
import DashboardReminderRow from '@/components/dashboard/widgets/DashboardReminderRow';
import { useTranslation } from '@/hooks/useTranslation';
import type { Reminder } from '@/types/reminder';
import ArrowDownIcon from '@public/icons/small/arrow_down.svg';

interface Props {
  reminders: Reminder[];
  onToggleComplete: (reminder: Reminder) => void;
  onSelectReminder: (reminder: Reminder) => void;
}

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
        <p className="px-1 py-6 text-center text-xsmall text-dark-secondary/80">
          {t('reminders.noRemindersYet')}
        </p>
      ) : (
        <>
          {active.map((reminder) => (
            <DashboardReminderRow
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
                className="mb-1.5 flex w-full items-center gap-1.5 rounded-lg bg-dark-surface-3/60 px-3 py-1.5 text-xsmall font-medium text-dark-secondary transition hover:bg-dark-surface-3"
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
                    <DashboardReminderRow
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
