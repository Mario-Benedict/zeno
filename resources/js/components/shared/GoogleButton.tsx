import { useTranslation } from '@/hooks/useTranslation';
import GoogleIcon from '@public/icons/small/google.svg';

const GoogleButton = () => {
  const { t } = useTranslation();

  return (
    <a
      href="/auth/google"
      className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-dark-border bg-dark-surface-3 px-4 py-2.5 text-sm font-medium text-dark-primary transition-colors hover:bg-dark-surface-3/70"
    >
      <GoogleIcon />
      {t('auth.google.continue')}
    </a>
  );
};

export default GoogleButton;
