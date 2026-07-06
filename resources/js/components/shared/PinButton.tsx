interface PinIconProps {
  filled: boolean;
}

export const PinIcon = ({ filled }: PinIconProps) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={filled ? 'text-accent-yellow' : 'text-dark-secondary'}
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

interface PinButtonProps {
  pinned: boolean;
  onToggle: () => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Shared pin toggle used for projects and reminders — a star-shaped icon
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
