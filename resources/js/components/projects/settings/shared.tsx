import { useTranslation } from '@/hooks/useTranslation';
import type { AssignableProjectRole } from '@/types';

export const useRoleLabels = (): Record<AssignableProjectRole, string> => {
  const { t } = useTranslation();

  return {
    ADMIN: t('common.admin'),
    MEMBER: t('common.member'),
    VIEWER: t('common.viewer'),
  };
};

export const inputClass =
  'w-full rounded-lg border border-dark-border bg-dark-input px-3 py-2.5 text-small text-dark-primary outline-none placeholder:text-dark-secondary transition-colors focus:border-dark-border-focus focus:bg-dark-input-focus disabled:cursor-not-allowed disabled:opacity-50';

export const getInitials = (name: string) =>
  name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
