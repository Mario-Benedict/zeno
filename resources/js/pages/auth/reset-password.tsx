import { Head, useForm } from '@inertiajs/react';
import type { FormEventHandler } from 'react';
import Button from '@/components/shared/Button';
import PasswordStrengthBar from '@/components/shared/PasswordStrengthBar';
import PasswordField from '@/components/shared/PasswordField';
import AuthLayout from '@/layouts/AuthLayout';
import { getPasswordStrength } from '@/lib/passwordStrength';

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

  const strength = getPasswordStrength(data.password);

  const submit: FormEventHandler = (e) => {
    e.preventDefault();
    post('/reset-password', {
      onFinish: () => reset('password', 'password_confirmation'),
    });
  };

  return (
    <AuthLayout
      title="Set New Password"
      description="Make sure to save your password in a password manager."
    >
      <Head title="Reset Password" />

      <form onSubmit={submit} className="space-y-4">
        <input type="hidden" name="token" value={data.token} />
        <input type="hidden" name="email" value={data.email} />

        <div>
          <PasswordField
            id="password"
            label="Password"
            value={data.password}
            onChange={(e) => setData('password', e.target.value)}
            autoComplete="new-password"
            autoFocus
            error={errors.password}
          />
          <PasswordStrengthBar strength={strength} />
        </div>

        <PasswordField
          id="password_confirmation"
          label="Confirm Password"
          value={data.password_confirmation}
          onChange={(e) => setData('password_confirmation', e.target.value)}
          autoComplete="new-password"
          error={errors.password_confirmation}
        />

        <Button type="submit" loading={processing} className="mt-2 w-full">
          {processing ? 'Resetting…' : 'Reset Password'}
        </Button>
      </form>
    </AuthLayout>
  );
};

export default ResetPassword;
