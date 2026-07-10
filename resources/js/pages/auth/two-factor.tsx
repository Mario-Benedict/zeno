import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import type { SyntheticEvent } from 'react';
import Button from '@/components/shared/Button';
import OtpInput from '@/components/shared/OtpInput';
import { useTranslation } from '@/hooks/useTranslation';
import AuthLayout from '@/layouts/AuthLayout';

const TwoFactor = () => {
  const { t } = useTranslation();
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const { post, processing, errors, setData } = useForm({ code: '' });

  const handleOtpChange = (value: string[]) => {
    setOtp(value);
    setData('code', value.join(''));
  };

  const submit = (e: SyntheticEvent) => {
    e.preventDefault();
    post('/two-factor');
  };

  return (
    <AuthLayout
      title={t('auth.twoFactor.title')}
      description={t('auth.twoFactor.description')}
    >
      <Head title={t('auth.twoFactor.headTitle')} />

      <form onSubmit={submit} className="space-y-6">
        <OtpInput value={otp} onChange={handleOtpChange} />

        {errors.code && (
          <p className="text-center text-xs text-status-error">{errors.code}</p>
        )}

        <Button type="submit" loading={processing} className="w-full">
          {processing
            ? t('auth.twoFactor.verifying')
            : t('auth.twoFactor.verify')}
        </Button>
      </form>
    </AuthLayout>
  );
};

export default TwoFactor;
