import { useState } from 'react';
import ConfirmModal from '@/components/shared/ConfirmModal';
import { PinButton } from '@/components/shared/PinButton';
import { useTranslation } from '@/hooks/useTranslation';
import type { Reminder } from '@/types/reminder';
import { formatReminderListDate, isReminderOverdue } from '@/utils/reminders';
import CloseIcon from '@public/icons/small/cancel.svg';
import CalendarIcon from '@public/icons/small/time.svg';

interface ReminderRowProps {
  reminder: Reminder;
  active: boolean;
  onSelect: () => void;
  onToggleComplete: () => void;
  onTogglePin: () => void;
  onDelete: () => void;
}

export const ReminderRow = ({
  reminder,
  active,
  onSelect,
  onToggleComplete,
  onTogglePin,
  onDelete,
}: ReminderRowProps) => {
  const { locale, t } = useTranslation();
  const localeCode = locale === 'id' ? 'id-ID' : 'en-US';
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const overdue =
    !reminder.is_completed && isReminderOverdue(reminder.reminder_due_at);

  return (
    <>
      {showDeleteConfirm && (
        <ConfirmModal
          title={t('reminders.deleteReminderTitle')}
          description={t('reminders.deleteReminderDescription', {
            title: reminder.reminder_title,
          })}
          confirmLabel={t('reminders.deleteReminderConfirm')}
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={() => {
            onDelete();
            setShowDeleteConfirm(false);
          }}
        />
      )}
      <div
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect();
          }
        }}
        className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors ${
          active
            ? 'bg-dark-surface-3'
            : 'bg-dark-surface-2 hover:bg-dark-surface-3'
        }`}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete();
          }}
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
            reminder.is_completed
              ? 'border-accent-blue bg-accent-blue'
              : 'border-dark-secondary hover:border-dark-primary'
          }`}
          aria-label={
            reminder.is_completed
              ? t('reminders.markAsNotDone')
              : t('reminders.markAsDone')
          }
        />

        <div className="min-w-0 flex-1">
          <p
            className={`truncate text-small font-semibold ${
              reminder.is_completed
                ? 'text-dark-secondary/80 line-through'
                : 'text-dark-primary'
            }`}
          >
            {reminder.reminder_title}
          </p>
          {reminder.reminder_due_at && (
            <p
              className={`mt-0.5 flex items-center gap-1 text-xsmall ${
                overdue ? 'text-accent-red' : 'text-dark-secondary'
              }`}
            >
              <CalendarIcon className="h-3 w-3" />
              {formatReminderListDate(reminder.reminder_due_at, localeCode)}
            </p>
          )}
        </div>

        <PinButton pinned={reminder.is_pinned} onToggle={onTogglePin} />

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowDeleteConfirm(true);
          }}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-dark-secondary transition-colors hover:bg-accent-red/10 hover:text-accent-red"
          title={t('reminders.deleteReminder')}
          aria-label={t('reminders.deleteReminder')}
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      </div>
    </>
  );
};
