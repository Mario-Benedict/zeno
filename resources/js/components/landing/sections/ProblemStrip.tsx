import { useTranslation } from '@/hooks/useTranslation';
import Reveal from '../primitives/Reveal';

const ProblemStrip = () => {
  const { t } = useTranslation();

  return (
    <section className="border-y border-landing-border/60 bg-landing-surface/30 px-4 py-16 sm:px-6">
      <Reveal className="mx-auto max-w-3xl text-center">
        <h2 className="text-h4 text-landing-primary sm:text-h3">
          {t('landing.problem.line')}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-normal text-landing-secondary sm:text-medium">
          {t('landing.problem.body')}
        </p>
      </Reveal>
    </section>
  );
};

export default ProblemStrip;
