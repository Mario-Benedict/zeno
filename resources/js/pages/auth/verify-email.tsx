import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import type { SyntheticEvent } from 'react';
import Button from '@/components/shared/Button';
import OtpInput from '@/components/shared/OtpInput';
import { useTranslation } from '@/hooks/useTranslation';
import AuthLayout from '@/layouts/AuthLayout';

interface VerifyEmailProps {
  status?: string;
}

const VerifyEmail = ({ status }: VerifyEmailProps) => {
  const { t } = useTranslation();
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const { post, processing, errors, setData } = useForm({ code: '' });
  const { post: resendPost, processing: resending } = useForm({});

  const handleOtpChange = (value: string[]) => {
    setOtp(value);
    setData('code', value.join(''));
  };

  const submit = (e: SyntheticEvent) => {
    e.preventDefault();
    post('/email/verify');
  };

  const resend = (e: SyntheticEvent) => {
    e.preventDefault();
    resendPost('/email/verification-notification');
  };

  const sent = status === 'verification-link-sent';

  return (
    <AuthLayout
      title={t('auth.verifyEmail.title')}
      description={t('auth.verifyEmail.description')}
    >
      <Head title={t('auth.verifyEmail.headTitle')} />

      {sent && (
        <div className="mb-4 rounded-lg bg-status-success/10 px-4 py-3 text-sm text-status-success">
          {t('auth.verifyEmail.codeSent')}
        </div>
      )}

      <form onSubmit={submit} className="space-y-6">
        <OtpInput value={otp} onChange={handleOtpChange} />

        {errors.code && (
          <p className="text-center text-xs text-status-error">{errors.code}</p>
        )}

        <Button type="submit" loading={processing} className="w-full">
          {processing
            ? t('auth.verifyEmail.verifying')
            : t('auth.verifyEmail.verify')}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-dark-secondary">
        {t('auth.verifyEmail.noCode')}{' '}
        <button
          type="button"
          onClick={resend}
          disabled={resending}
          className="font-semibold text-dark-primary transition-colors hover:text-dark-primary/80 disabled:opacity-50"
        >
          {t('auth.verifyEmail.resendCode')}
        </button>
      </p>
    </AuthLayout>
  );
};

export default VerifyEmail;
