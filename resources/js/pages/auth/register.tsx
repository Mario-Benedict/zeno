import { Head, Link, useForm } from '@inertiajs/react';
import type { SubmitEventHandler } from 'react';
import Button from '@/components/shared/Button';
import InputField from '@/components/shared/FloatInputField';
import PasswordField from '@/components/shared/PasswordField';
import AuthLayout from '@/layouts/AuthLayout';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const getPasswordStrength = (password: string): 0 | 1 | 2 | 3 => {
  if (password.length === 0) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) score++;
  return score as 0 | 1 | 2 | 3;
};

const strengthLabel = ['', 'Weak', 'Fair', 'Strong'] as const;
const strengthColor = ['', 'bg-status-error', 'bg-status-warning', 'bg-status-success'] as const;

const Register = () => {
  const { data, setData, post, processing, errors, reset } = useForm({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    password_confirmation: '',
  });

  const submit: SubmitEventHandler = (e) => {
    e.preventDefault();
    post('/register', {
      onFinish: () => reset('password', 'password_confirmation'),
    });
  };

  const strength = getPasswordStrength(data.password);

  return (
    <AuthLayout title="Create an account" description="Fill in your details to get started">
      <Head title="Register" />

      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <InputField
            id="first_name"
            label="First name"
            type="text"
            value={data.first_name}
            onChange={(e) => setData('first_name', e.target.value)}
            autoComplete="given-name"
            autoFocus
            error={errors.first_name}
          />
          <InputField
            id="last_name"
            label="Last name"
            type="text"
            value={data.last_name}
            onChange={(e) => setData('last_name', e.target.value)}
            autoComplete="family-name"
            error={errors.last_name}
          />
        </div>

        <InputField
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
          {data.password.length > 0 && (
            <div className="mt-2">
              <div className="flex gap-1">
                {[1, 2, 3].map((level) => (
                  <div
                    key={level}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      strength >= level ? strengthColor[strength] : 'bg-dark-surface-3'
                    }`}
                  />
                ))}
              </div>
              <p className="mt-1 text-xs text-dark-secondary">
                {strengthLabel[strength]} use uppercase, numbers &amp; symbols for a strong password
              </p>
            </div>
          )}
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

      <a
        href="/auth/google"
        className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-dark-border bg-dark-primary px-4 py-2.5 text-sm font-medium text-dark-surface-1 transition-colors hover:bg-dark-primary/90"
      >
        <GoogleIcon />
        Continue with Google
      </a>

      <p className="mt-6 text-center text-sm text-dark-secondary">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-dark-primary underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
};

export default Register;
