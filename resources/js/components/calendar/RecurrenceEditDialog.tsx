import { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';

interface RecurrenceEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (scope: 'single' | 'all') => void;
  action: 'edit' | 'delete';
}

export const RecurrenceEditDialog = ({
  isOpen,
  onClose,
  onConfirm,
  action,
}: RecurrenceEditDialogProps) => {
  const { t } = useTranslation();
  const [scope, setScope] = useState<'single' | 'all'>('single');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl border border-dark-border bg-dark-surface-1 shadow-2xl">
        <div className="border-b border-dark-border px-5 py-4">
          <h2 className="text-large font-semibold text-dark-primary">
            {action === 'edit'
              ? t('calendar.editRecurringSchedule')
              : t('calendar.deleteRecurringSchedule')}
          </h2>
        </div>

        <div className="p-5">
          <p className="mb-4 text-small text-dark-secondary">
            {t('calendar.recurrenceEditPrompt', {
              action:
                action === 'edit'
                  ? t('calendar.recurrenceActionEdit')
                  : t('calendar.recurrenceActionDelete'),
            })}
          </p>

          <div className="mb-6 flex flex-col gap-2">
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dark-border p-3 transition hover:bg-dark-surface-2">
              <input
                type="radio"
                name="recurrence_scope"
                value="single"
                checked={scope === 'single'}
                onChange={() => setScope('single')}
                className="text-accent-blue focus:ring-accent-blue"
              />
              <span className="text-small font-medium text-dark-primary">
                {t('calendar.thisOccurrenceOnly')}
              </span>
            </label>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dark-border p-3 transition hover:bg-dark-surface-2">
              <input
                type="radio"
                name="recurrence_scope"
                value="all"
                checked={scope === 'all'}
                onChange={() => setScope('all')}
                className="text-accent-blue focus:ring-accent-blue"
              />
              <span className="text-small font-medium text-dark-primary">
                {t('calendar.allOccurrencesInSeries')}
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-small font-medium text-dark-primary transition hover:bg-dark-surface-2"
            >
              {t('calendar.cancel')}
            </button>
            <button
              onClick={() => onConfirm(scope)}
              className={`rounded-lg px-4 py-2 text-small font-medium text-white transition ${
                action === 'delete'
                  ? 'bg-status-error hover:bg-status-error/90'
                  : 'bg-accent-blue hover:bg-accent-blue/90'
              }`}
            >
              {t('calendar.confirm')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
