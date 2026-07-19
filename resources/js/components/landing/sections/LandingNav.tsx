import { Link } from '@inertiajs/react';
import { useTranslation } from '@/hooks/useTranslation';
import Logo from '@public/logos/logo.svg';
import LandingButton from '../primitives/LandingButton';

const LandingNav = () => {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-50 border-b border-landing-border/70 bg-landing-bg/80 backdrop-blur-md">
      <a
        href="#main"
        className="sr-only rounded-lg bg-landing-surface px-4 py-2 text-sm focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50"
      >
        {t('landing.nav.skipToContent')}
      </a>
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Logo width={26} height={26} aria-hidden="true" />
          <span className="text-medium font-semibold tracking-tight text-landing-primary">
            Zeno
          </span>
        </Link>

        {/* The only two CTAs on the page: Log in and Sign up. */}
        <div className="flex items-center gap-2 sm:gap-3">
          <LandingButton
            href="/login"
            variant="secondary"
            className="px-4 py-2"
          >
            {t('landing.nav.login')}
          </LandingButton>
          <LandingButton href="/register" className="px-4 py-2">
            {t('landing.nav.signup')}
          </LandingButton>
        </div>
      </nav>
    </header>
  );
};

export default LandingNav;
