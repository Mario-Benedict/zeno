import { Head, useForm } from '@inertiajs/react';
import type { FormEventHandler } from 'react';
import Button from '@/components/shared/Button';
import FloatInputField from '@/components/shared/FloatInputField';
import PasswordField from '@/components/shared/PasswordField';
import AuthLayout from '@/layouts/AuthLayout';

interface ResetPasswordProps {
  token: string;
  email: string;
}

const ResetPassword = ({ token, email }: ResetPasswordProps) => {
  const { data, setData, post, processing, errors, reset } = useForm({
    token,
    email,
    password: '',
    password_confirmation: '',
  });

  const submit: FormEventHandler = (e) => {
    e.preventDefault();
    post('/reset-password', {
      onFinish: () => reset('password', 'password_confirmation'),
    });
  };

  return (
    <AuthLayout
      title="Reset your password"
      description="Choose a new password for your account"
    >
      <Head title="Reset Password" />

      <form onSubmit={submit} className="space-y-4">
        <FloatInputField
          id="email"
          label="Email"
          type="email"
          value={data.email}
          onChange={(e) => setData('email', e.target.value)}
          autoComplete="email"
          error={errors.email}
        />

        <PasswordField
          id="password"
          label="New password"
          value={data.password}
          onChange={(e) => setData('password', e.target.value)}
          autoComplete="new-password"
          autoFocus
          error={errors.password}
        />

        <PasswordField
          id="password_confirmation"
          label="Confirm new password"
          value={data.password_confirmation}
          onChange={(e) => setData('password_confirmation', e.target.value)}
          autoComplete="new-password"
          error={errors.password_confirmation}
        />

        <Button type="submit" loading={processing} className="mt-2 w-full">
          {processing ? 'Resetting…' : 'Reset password'}
        </Button>
      </form>
    </AuthLayout>
  );
};

export default ResetPassword;
