import type { ReactNode } from 'react';
import CloseIcon from '@public/icons/small/cancel.svg';
import SearchIcon from '@public/icons/small/search.svg';

interface WidgetFrameProps {
  title: string;
  count?: string;
  /** Overrides the default search + remove controls (e.g. the calendar's ‹ › nav). */
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}

// Mirrors the real dashboard widget chrome (WidgetSearchHeader + a rounded-2xl
// surface-2 shell): a title, an optional count, and search + remove controls in
// the top-right. Every feature widget mockup uses this so the landing snapshots
// share the exact frame the live dashboard widgets have.
const WidgetFrame = ({
  title,
  count,
  actions,
  className = '',
  children,
}: WidgetFrameProps) => (
  <div
    className={`flex flex-col overflow-hidden rounded-2xl bg-landing-app-2 ${className}`}
    aria-hidden="true"
  >
    <div className="flex shrink-0 items-center gap-2 px-3 pt-3 pb-2">
      <span className="flex-1 truncate text-small font-semibold text-landing-app-fg">
        {title}
      </span>
      {count && <span className="text-xsmall text-white/30">{count}</span>}
      {actions ?? (
        <>
          <SearchIcon className="h-3.5 w-3.5 text-white/40" />
          <CloseIcon className="h-3.5 w-3.5 text-white/40" />
        </>
      )}
    </div>
    {children}
  </div>
);

export default WidgetFrame;
