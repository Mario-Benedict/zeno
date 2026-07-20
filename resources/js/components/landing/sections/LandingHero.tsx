import { useTranslation } from '@/hooks/useTranslation';
import HeroMockup from '../mockups/HeroMockup';
import HeroCanvas from '../primitives/HeroCanvas';
import LandingButton from '../primitives/LandingButton';
import Reveal from '../primitives/Reveal';

const LandingHero = () => {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden px-4 pt-16 pb-20 sm:px-6 sm:pt-24">
      {/* Decorative back layers: CSS glow + WebGL particle field (both aria-hidden;
          the canvas degrades to just the glow where WebGL is unavailable). */}
      <div
        className="landing-glow-hero pointer-events-none absolute inset-x-0 top-0 h-[520px]"
        aria-hidden="true"
      />
      <HeroCanvas />

      <Reveal className="relative mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-landing-border bg-landing-surface/60 px-3 py-1 text-xsmall font-medium text-landing-secondary">
          <span className="h-1.5 w-1.5 rounded-full bg-landing-glow-cyan" />
          {t('landing.hero.badge')}
        </span>

        <h1 className="mt-6 text-display-1 text-landing-primary sm:text-display-2 lg:text-display-3">
          {t('landing.hero.headline')}
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-medium text-landing-secondary sm:text-large">
          {t('landing.hero.subhead')}
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <LandingButton
            href="/register"
            className="w-full px-6 py-3 sm:w-auto"
          >
            {t('landing.hero.signup')}
          </LandingButton>
          <LandingButton
            href="/login"
            variant="secondary"
            className="w-full px-6 py-3 sm:w-auto"
          >
            {t('landing.hero.login')}
          </LandingButton>
        </div>

        <p className="mt-4 text-xsmall text-landing-muted">
          {t('landing.hero.note')}
        </p>
      </Reveal>

      <Reveal delay={120} className="relative mx-auto mt-14 max-w-4xl">
        <HeroMockup />
      </Reveal>
    </section>
  );
};

export default LandingHero;
