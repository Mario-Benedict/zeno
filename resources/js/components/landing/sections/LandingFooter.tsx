import { Link } from '@inertiajs/react';
import { useTranslation } from '@/hooks/useTranslation';
import Logo from '@public/logos/logo.svg';

const LandingFooter = () => {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-landing-border px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <Logo width={26} height={26} aria-hidden="true" />
            <div>
              <p className="text-medium font-semibold text-landing-primary">
                Zeno
              </p>
              <p className="text-xsmall text-landing-muted">
                {t('landing.footer.tagline')}
              </p>
            </div>
          </div>

          <nav className="flex items-center gap-6 text-small">
            <Link
              href="/login"
              className="text-landing-secondary transition-colors hover:text-landing-primary"
            >
              {t('landing.footer.login')}
            </Link>
            <Link
              href="/register"
              className="text-landing-secondary transition-colors hover:text-landing-primary"
            >
              {t('landing.footer.signup')}
            </Link>
          </nav>
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-landing-border/60 pt-6">
          <p className="text-xsmall text-landing-muted">
            {t('landing.footer.rights')}
          </p>
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="h-2 w-2 rounded-full bg-landing-glow-cyan" />
            <span className="h-2 w-2 rounded-full bg-landing-glow-blue" />
            <span className="h-2 w-2 rounded-full bg-landing-glow-purple" />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
