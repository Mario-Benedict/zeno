const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

interface RelativeTimeLabels {
  justNow: string;
  minutesAgo: (count: number) => string;
  hoursAgo: (count: number) => string;
  daysAgo: (count: number) => string;
}

/**
 * Formats a timestamp as a short, human-meaningful relative label,
 * never in seconds. Anything under a minute uses the provided immediate label
 * since second-level precision isn't meaningful for
 * autosave status or note list timestamps.
 */
export const formatRelativeTime = (
  iso: string | null | undefined,
  labels: RelativeTimeLabels,
  locale = 'en-US',
  now: Date = new Date(),
): string => {
  if (!iso) return '';

  const then = new Date(iso).getTime();
  const diff = now.getTime() - then;

  if (diff < MINUTE) return labels.justNow;
  if (diff < HOUR) return labels.minutesAgo(Math.floor(diff / MINUTE));
  if (diff < DAY) return labels.hoursAgo(Math.floor(diff / HOUR));
  if (diff < WEEK) return labels.daysAgo(Math.floor(diff / DAY));

  return new Date(then).toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
  });
};
