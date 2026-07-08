import { useTranslation } from '@/hooks/useTranslation';

export const NoReminderSelected = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-1 items-center justify-center rounded-2xl bg-dark-surface-2">
      <p className="text-small font-medium text-dark-secondary">
        {t('reminders.noReminderSelected')}
      </p>
    </div>
  );
};
