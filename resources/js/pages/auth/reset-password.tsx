import { Head, useForm } from '@inertiajs/react';
import type { SyntheticEvent } from 'react';
import Button from '@/components/shared/Button';
import PasswordField from '@/components/shared/PasswordField';
import PasswordStrengthBar from '@/components/shared/PasswordStrengthBar';
import { useTranslation } from '@/hooks/useTranslation';
import AuthLayout from '@/layouts/AuthLayout';
import { getPasswordStrength } from '@/lib/passwordStrength';

interface ResetPasswordProps {
  token: string;
  email: string;
}

const ResetPassword = ({ token, email }: ResetPasswordProps) => {
  const { t } = useTranslation();
  const { data, setData, post, processing, errors, reset } = useForm({
    token,
    email,
    password: '',
    password_confirmation: '',
  });

  const strength = getPasswordStrength(data.password);

  const submit = (e: SyntheticEvent) => {
    e.preventDefault();
    post('/reset-password', {
      onFinish: () => reset('password', 'password_confirmation'),
    });
  };

  return (
    <AuthLayout
      title={t('auth.resetPassword.title')}
      description={t('auth.resetPassword.description')}
    >
      <Head title={t('auth.resetPassword.headTitle')} />

      <form onSubmit={submit} className="space-y-4">
        <input type="hidden" name="token" value={data.token} />
        <input type="hidden" name="email" value={data.email} />

        <div>
          <PasswordField
            id="password"
            label={t('auth.resetPassword.passwordLabel')}
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
          label={t('auth.resetPassword.confirmPasswordLabel')}
          value={data.password_confirmation}
          onChange={(e) => setData('password_confirmation', e.target.value)}
          autoComplete="new-password"
          error={errors.password_confirmation}
        />

        <Button type="submit" loading={processing} className="mt-2 w-full">
          {processing
            ? t('auth.resetPassword.resetting')
            : t('auth.resetPassword.reset')}
        </Button>
      </form>
    </AuthLayout>
  );
};

export default ResetPassword;
