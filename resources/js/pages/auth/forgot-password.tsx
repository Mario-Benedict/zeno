import { Head, Link, useForm } from '@inertiajs/react';
import type { SyntheticEvent } from 'react';
import Button from '@/components/shared/Button';
import FloatInputField from '@/components/shared/FloatInputField';
import { useTranslation } from '@/hooks/useTranslation';
import AuthLayout from '@/layouts/AuthLayout';

interface ForgotPasswordProps {
  status?: string;
}

const ForgotPassword = ({ status }: ForgotPasswordProps) => {
  const { t } = useTranslation();
  const { data, setData, post, processing, errors } = useForm({ email: '' });

  const submit = (e: SyntheticEvent) => {
    e.preventDefault();
    post('/forgot-password');
  };

  return (
    <AuthLayout
      title={t('auth.forgotPassword.title')}
      description={t('auth.forgotPassword.description')}
    >
      <Head title={t('auth.forgotPassword.headTitle')} />

      {status && (
        <div className="mb-4 rounded-lg bg-status-success/10 px-4 py-3 text-sm text-status-success">
          {status}
        </div>
      )}

      <form onSubmit={submit} className="space-y-4">
        <FloatInputField
          id="email"
          label={t('auth.forgotPassword.emailLabel')}
          type="email"
          value={data.email}
          onChange={(e) => setData('email', e.target.value)}
          autoComplete="email"
          autoFocus
          error={errors.email}
        />

        <Button type="submit" loading={processing} className="mt-2 w-full">
          {processing
            ? t('auth.forgotPassword.sending')
            : t('auth.forgotPassword.continue')}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-dark-secondary">
        {t('auth.forgotPassword.rememberedIt')}{' '}
        <Link
          href="/login"
          className="font-medium text-dark-primary underline underline-offset-4"
        >
          {t('auth.forgotPassword.backToLogin')}
        </Link>
      </p>
    </AuthLayout>
  );
};

export default ForgotPassword;
