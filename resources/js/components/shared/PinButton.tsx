import PinIconSvg from '@public/icons/small/pin.svg';

interface PinIconProps {
  filled: boolean;
}

export const PinIcon = ({ filled }: PinIconProps) => (
  <PinIconSvg
    fill={filled ? 'currentColor' : 'none'}
    className={filled ? 'text-accent-yellow' : 'text-dark-secondary'}
  />
);

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
}: PinButtonProps) => (
  <button
    type="button"
    disabled={disabled}
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      onToggle();
    }}
    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-70 ${className}`}
    aria-label={pinned ? 'Unpin' : 'Pin'}
  >
    <PinIcon filled={pinned} />
  </button>
);
