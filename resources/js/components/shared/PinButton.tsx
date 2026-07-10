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
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
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
