import { Head } from '@inertiajs/react';
import {
  BentoGrid,
  ClosingCTA,
  ConflictSpotlight,
  LandingFooter,
  LandingHero,
  LandingNav,
  ProblemStrip,
} from '@/components/landing';
import { useTranslation } from '@/hooks/useTranslation';

const Welcome = () => {
  const { t } = useTranslation();

  return (
    <>
      {/*
        Tab title goes through Inertia's `title` prop, so createInertiaApp's
        `${title} - ${appName}` template appends the configured app name
        (the brand in a real deploy). The page title is the tagline only, so the
        brand isn't duplicated; the full-brand form lives on the OG/social title.
      */}
      <Head title={t('landing.meta.title')}>
        <meta name="description" content={t('landing.meta.description')} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Zeno" />
        <meta property="og:title" content={t('landing.meta.ogTitle')} />
        <meta
          property="og:description"
          content={t('landing.meta.description')}
        />
        <meta property="og:image" content="/logos/logo.svg" />
        <meta property="og:image:alt" content={t('landing.meta.ogImageAlt')} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={t('landing.meta.ogTitle')} />
        <meta
          name="twitter:description"
          content={t('landing.meta.description')}
        />
      </Head>

      <div className="min-h-screen bg-landing-bg font-sans text-landing-primary antialiased">
        <LandingNav />
        <main id="main">
          <LandingHero />
          <ProblemStrip />
          <BentoGrid />
          <ConflictSpotlight />
          <ClosingCTA />
        </main>
        <LandingFooter />
      </div>
    </>
  );
};

export default Welcome;
