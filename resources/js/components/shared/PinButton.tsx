import PinIcon from '@/components/shared/PinIcon';
import { useTranslation } from '@/hooks/useTranslation';

interface PinButtonProps {
  pinned: boolean;
  onToggle: () => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Shared pin toggle used for projects and reminders — a pin-shaped icon
 * that fills in when the item is pinned.
 */
export const PinButton = ({
  pinned,
  onToggle,
  disabled = false,
  className = '',
}: PinButtonProps) => {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-70 ${className}`}
      aria-label={pinned ? t('common.unpin') : t('common.pin')}
    >
      <PinIcon filled={pinned} />
    </button>
  );
};
