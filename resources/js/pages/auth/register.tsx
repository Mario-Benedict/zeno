import { Head, Link, useForm } from '@inertiajs/react';
import type { SubmitEventHandler } from 'react';
import Button from '@/components/shared/Button';
import FloatInputField from '@/components/shared/FloatInputField';
import GoogleButton from '@/components/shared/GoogleButton';
import PasswordField from '@/components/shared/PasswordField';
import PasswordStrengthBar from '@/components/shared/PasswordStrengthBar';
import AuthLayout from '@/layouts/AuthLayout';
import { getPasswordStrength } from '@/lib/passwordStrength';

const Register = () => {
  const { data, setData, post, processing, errors, reset } = useForm({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    password_confirmation: '',
  });

  const strength = getPasswordStrength(data.password);

  const submit: SubmitEventHandler = (e) => {
    e.preventDefault();
    post('/register', {
      onFinish: () => reset('password', 'password_confirmation'),
    });
  };

  return (
    <AuthLayout
      title="Create an account"
      description="Fill in your details to get started"
    >
      <Head title="Register" />

      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <FloatInputField
            id="first_name"
            label="First name"
            type="text"
            value={data.first_name}
            onChange={(e) => setData('first_name', e.target.value)}
            autoComplete="given-name"
            autoFocus
            error={errors.first_name}
          />
          <FloatInputField
            id="last_name"
            label="Last name"
            type="text"
            value={data.last_name}
            onChange={(e) => setData('last_name', e.target.value)}
            autoComplete="family-name"
            error={errors.last_name}
          />
        </div>

        <FloatInputField
          id="email"
          label="Email"
          type="email"
          value={data.email}
          onChange={(e) => setData('email', e.target.value)}
          autoComplete="email"
          error={errors.email}
        />

        <div>
          <PasswordField
            id="password"
            label="Password"
            value={data.password}
            onChange={(e) => setData('password', e.target.value)}
            autoComplete="new-password"
            error={errors.password}
          />
          <PasswordStrengthBar strength={strength} />
        </div>

        <PasswordField
          id="password_confirmation"
          label="Confirm password"
          value={data.password_confirmation}
          onChange={(e) => setData('password_confirmation', e.target.value)}
          autoComplete="new-password"
          error={errors.password_confirmation}
        />

        <Button type="submit" loading={processing} className="mt-2 w-full">
          {processing ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-dark-border" />
        <span className="text-xs text-dark-secondary">or</span>
        <div className="h-px flex-1 bg-dark-border" />
      </div>

      <GoogleButton />

      <p className="mt-6 text-center text-sm text-dark-secondary">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-medium text-dark-primary underline underline-offset-4"
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
};

export default Register;
