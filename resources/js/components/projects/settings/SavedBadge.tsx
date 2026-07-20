import { useTranslation } from '@/hooks/useTranslation';
import CheckIcon from '@public/icons/small/check.svg';

interface SavedBadgeProps {
  visible: boolean;
}

const SavedBadge = ({ visible }: SavedBadgeProps) => {
  const { t } = useTranslation();

  return (
    <span
      className={`flex items-center gap-1.5 text-xsmall font-semibold text-status-success transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
    >
      <CheckIcon />
      {t('projectSettingsTabs.saved')}
    </span>
  );
};

export default SavedBadge;
