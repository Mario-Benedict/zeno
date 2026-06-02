import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import type { SyntheticEvent } from 'react';
import Button from '@/components/shared/Button';
import OtpInput from '@/components/shared/OtpInput';
import AuthLayout from '@/layouts/AuthLayout';

const TwoFactor = () => {
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
      title="2-FA Authentication"
      description="Enter 6-digit code from your two factor authentication App."
    >
      <Head title="Two-Factor Authentication" />

      <form onSubmit={submit} className="space-y-6">
        <OtpInput value={otp} onChange={handleOtpChange} />

        {errors.code && (
          <p className="text-center text-xs text-status-error">{errors.code}</p>
        )}

        <Button type="submit" loading={processing} className="w-full">
          {processing ? 'Verifying…' : 'Verify'}
        </Button>
      </form>
    </AuthLayout>
  );
};

export default TwoFactor;
