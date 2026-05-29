import { Head, Link, useForm } from '@inertiajs/react';
import type { FormEventHandler } from 'react';
import Button from '@/components/shared/Button';
import FloatInputField from '@/components/shared/FloatInputField';
import AuthLayout from '@/layouts/AuthLayout';

interface ForgotPasswordProps {
  status?: string;
}

const ForgotPassword = ({ status }: ForgotPasswordProps) => {
  const { data, setData, post, processing, errors } = useForm({ email: '' });

  const submit: FormEventHandler = (e) => {
    e.preventDefault();
    post('/forgot-password');
  };

  return (
    <AuthLayout
      title="Forgot Password"
      description="Please enter your email address to reset your password."
    >
      <Head title="Forgot Password" />

      {status && (
        <div className="mb-4 rounded-lg bg-status-success/10 px-4 py-3 text-sm text-status-success">
          {status}
        </div>
      )}

      <form onSubmit={submit} className="space-y-4">
        <FloatInputField
          id="email"
          label="Email"
          type="email"
          value={data.email}
          onChange={(e) => setData('email', e.target.value)}
          autoComplete="email"
          autoFocus
          error={errors.email}
        />

        <Button type="submit" loading={processing} className="mt-2 w-full">
          {processing ? 'Sending…' : 'Continue'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-dark-secondary">
        Remembered it?{' '}
        <Link
          href="/login"
          className="font-medium text-dark-primary underline underline-offset-4"
        >
          Back to Login
        </Link>
      </p>
    </AuthLayout>
  );
};

export default ForgotPassword;
