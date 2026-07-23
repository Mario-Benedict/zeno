import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useIsDesktopViewport } from '@/hooks/useIsDesktopViewport';
import { useTranslation } from '@/hooks/useTranslation';
import DesktopIcon from '@public/icons/large/desktop.svg';
import Zeno from '@public/logos/logo.svg';

/**
 * Blocks the whole app below a desktop-sized viewport instead of trying to
 * adapt every page's fixed-width, desktop-only layout. Uses the `landing.*`
 * palette (literal hex, immune to the light/dark mode toggle — see the
 * `@theme` comment in app.css) so this reads the same regardless of the
 * visitor's theme preference.
 */
const DeviceGate = ({ children }: { children: ReactNode }) => {
  const isDesktop = useIsDesktopViewport();
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isDesktop) return;
    // Deferred to a fresh frame so the class toggle re-triggers the CSS
    // transition instead of the element mounting already in its end state.
    const frame = requestAnimationFrame(() => setVisible(true));

    return () => cancelAnimationFrame(frame);
  }, [isDesktop]);

  if (isDesktop) return <>{children}</>;

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-landing-bg px-6 py-12 text-landing-primary">
      <div
        className="landing-glow-hero pointer-events-none absolute inset-x-0 top-0 h-[520px]"
        aria-hidden="true"
      />

      <div
        className={`landing-reveal relative flex max-w-md flex-col items-center text-center ${visible ? 'is-visible' : ''}`}
      >
        <Zeno width={36} height={36} aria-hidden="true" />

        <span className="mt-8 inline-flex items-center gap-2 rounded-full border border-landing-border bg-landing-surface/60 px-3 py-1 text-xsmall font-medium text-landing-secondary">
          <span className="h-1.5 w-1.5 rounded-full bg-landing-glow-cyan" />
          {t('deviceGate.eyebrow')}
        </span>

        <div className="mt-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-landing-border bg-landing-surface text-landing-glow-blue">
          <DesktopIcon className="h-7 w-7" />
        </div>

        <h1 className="mt-6 text-h5 text-landing-primary">
          {t('deviceGate.title')}
        </h1>

        <p className="mt-3 text-normal text-landing-secondary">
          {t('deviceGate.description')}
        </p>

        <p className="mt-6 text-xsmall text-landing-muted">
          {t('deviceGate.hint')}
        </p>
      </div>
    </div>
  );
};

export default DeviceGate;
