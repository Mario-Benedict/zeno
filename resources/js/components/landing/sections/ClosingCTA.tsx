import { useTranslation } from '@/hooks/useTranslation';
import LandingButton from '../primitives/LandingButton';
import Reveal from '../primitives/Reveal';

const ClosingCTA = () => {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden px-4 py-24 sm:px-6">
      <div
        className="landing-glow-spotlight pointer-events-none absolute inset-0"
        aria-hidden="true"
      />
      <Reveal className="relative mx-auto max-w-2xl text-center">
        <h2 className="text-h3 text-landing-primary sm:text-h2">
          {t('landing.closing.heading')}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-normal text-landing-secondary sm:text-medium">
          {t('landing.closing.body')}
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <LandingButton
            href="/register"
            className="w-full px-6 py-3 sm:w-auto"
          >
            {t('landing.closing.signup')}
          </LandingButton>
          <LandingButton
            href="/login"
            variant="secondary"
            className="w-full px-6 py-3 sm:w-auto"
          >
            {t('landing.closing.login')}
          </LandingButton>
        </div>
      </Reveal>
    </section>
  );
};

export default ClosingCTA;
