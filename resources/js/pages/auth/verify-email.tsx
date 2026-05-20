import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import type { FormEventHandler } from 'react';
import Button from '@/components/shared/Button';
import OtpInput from '@/components/shared/OtpInput';
import AuthLayout from '@/layouts/AuthLayout';

interface VerifyEmailProps {
  status?: string;
}

const VerifyEmail = ({ status }: VerifyEmailProps) => {
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const { post, processing, errors, setData } = useForm({ code: '' });
  const { post: resendPost, processing: resending } = useForm({});

  const handleOtpChange = (value: string[]) => {
    setOtp(value);
    setData('code', value.join(''));
  };

  const submit: FormEventHandler = (e) => {
    e.preventDefault();
    post('/email/verify');
  };

  const resend: FormEventHandler = (e) => {
    e.preventDefault();
    resendPost('/email/verification-notification');
  };

  const sent = status === 'verification-link-sent';

  return (
    <AuthLayout
      title="Verify Your Email"
      description="Enter 6-digit code from email to verify your identity."
    >
      <Head title="Email Verification" />

      {sent && (
        <div className="mb-4 rounded-lg bg-status-success/10 px-4 py-3 text-sm text-status-success">
          A new verification code has been sent to your email.
        </div>
      )}

      <form onSubmit={submit} className="space-y-6">
        <OtpInput value={otp} onChange={handleOtpChange} />

        {errors.code && (
          <p className="text-center text-xs text-status-error">{errors.code}</p>
        )}

        <Button type="submit" loading={processing} className="w-full">
          {processing ? 'Verifying…' : 'Verify'}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-dark-secondary">
        Didn't get the code?{' '}
        <button
          type="button"
          onClick={resend}
          disabled={resending}
          className="font-semibold text-dark-primary transition-colors hover:text-dark-primary/80 disabled:opacity-50"
        >
          Resend Code
        </button>
      </p>
    </AuthLayout>
  );
};

export default VerifyEmail;
