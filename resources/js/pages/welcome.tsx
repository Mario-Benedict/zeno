import { Head } from '@inertiajs/react';
import { useTranslation } from '@/hooks/useTranslation';

const Welcome = () => {
  const { t } = useTranslation();

  return (
    <>
      <Head title={t('common.welcome')} />
      <p>{t('common.welcome')}</p>
    </>
  );
};

export default Welcome;
