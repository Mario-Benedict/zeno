import { useTranslation } from '@/hooks/useTranslation';
import ConflictMockup from '../mockups/ConflictMockup';
import Reveal from '../primitives/Reveal';

const ConflictSpotlight = () => {
  const { t } = useTranslation();

  const steps = [
    {
      title: t('landing.spotlight.step1Title'),
      body: t('landing.spotlight.step1Body'),
    },
    {
      title: t('landing.spotlight.step2Title'),
      body: t('landing.spotlight.step2Body'),
    },
    {
      title: t('landing.spotlight.step3Title'),
      body: t('landing.spotlight.step3Body'),
    },
  ];

  return (
    <section className="relative overflow-hidden border-y border-landing-border/60 px-4 py-24 sm:px-6">
      <div
        className="landing-glow-spotlight pointer-events-none absolute inset-0"
        aria-hidden="true"
      />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        <Reveal direction="left">
          <span className="inline-flex items-center gap-2 rounded-full border border-landing-glow-blue/40 bg-landing-glow-blue/10 px-3 py-1 text-xsmall font-semibold text-landing-glow-blue">
            {t('landing.spotlight.tag')}
          </span>
          <h2 className="mt-5 text-h3 text-landing-primary sm:text-h2">
            {t('landing.spotlight.heading')}
          </h2>
          <p className="mt-4 text-normal text-landing-secondary sm:text-medium">
            {t('landing.spotlight.body')}
          </p>

          <ol className="mt-8 flex flex-col gap-5">
            {steps.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-landing-border bg-landing-surface text-small font-semibold text-landing-glow-cyan">
                  {index + 1}
                </span>
                <div>
                  <p className="text-normal font-semibold text-landing-primary">
                    {step.title}
                  </p>
                  <p className="mt-1 text-small text-landing-secondary">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>

        <Reveal direction="right" className="mx-auto w-full max-w-md lg:mx-0">
          <ConflictMockup />
        </Reveal>
      </div>
    </section>
  );
};

export default ConflictSpotlight;
