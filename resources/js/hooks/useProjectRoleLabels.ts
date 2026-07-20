import { useTranslation } from '@/hooks/useTranslation';
import type { AssignableProjectRole } from '@/types';

export const useProjectRoleLabels = (): Record<
  AssignableProjectRole,
  string
> => {
  const { t } = useTranslation();

  return {
    ADMIN: t('common.admin'),
    MEMBER: t('common.member'),
    VIEWER: t('common.viewer'),
  };
};
