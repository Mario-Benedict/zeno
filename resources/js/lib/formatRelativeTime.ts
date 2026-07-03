const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

/**
 * Formats a timestamp as a short, human-meaningful relative label —
 * never in seconds. Anything under a minute reads as "Just now" rather
 * than "12s ago", since second-level precision isn't meaningful for
 * autosave status or note list timestamps.
 */
export const formatRelativeTime = (iso: string | null | undefined, now: Date = new Date()): string => {
  if (!iso) return '';

  const then = new Date(iso).getTime();
  const diff = now.getTime() - then;

  if (diff < MINUTE) return 'Just now';
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`;
  if (diff < WEEK) return `${Math.floor(diff / DAY)}d ago`;

  return new Date(then).toLocaleDateString([], { month: 'short', day: 'numeric' });
};
