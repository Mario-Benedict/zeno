import { useEffect, useState } from 'react';
import { formatRelativeTime } from '@/lib/formatRelativeTime';

/**
 * Live-formats an ISO timestamp as "Just now" / "5m ago" / "3h ago". The
 * label itself is computed fresh on every render (not stored in state) —
 * a `tick` counter just forces a re-render every 30s so it ages in place
 * without a page reload, e.g. "Saved just now" aging to "Saved 2m ago".
 */
export const useRelativeTime = (iso: string | null | undefined): string => {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!iso) return;

    const interval = setInterval(() => setTick((t) => t + 1), 30_000);

    return () => clearInterval(interval);
  }, [iso]);

  return formatRelativeTime(iso);
};
