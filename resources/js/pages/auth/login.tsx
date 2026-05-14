import { Head, Link, useForm } from '@inertiajs/react';
import type { SubmitEventHandler } from 'react';
import Button from '@/components/shared/Button';
import Checkbox from '@/components/shared/Checkbox';
import InputField from '@/components/shared/FloatInputField';
import PasswordField from '@/components/shared/PasswordField';
import AuthLayout from '@/layouts/AuthLayout';

interface LoginProps {
  status?: string;
  canResetPassword: boolean;
}

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

export default function Login({ status, canResetPassword }: LoginProps) {
  const { data, setData, post, processing, errors, reset } = useForm({
    email: '',
    password: '',
    remember: false as boolean,
  });

  const submit: SubmitEventHandler = (e) => {
    e.preventDefault();
    post('/login', { onFinish: () => reset('password') });
  };

  return (
    <AuthLayout title="Welcome back" description="Sign in to your account to continue">
      <Head title="Log in" />

      {status && (
        <div className="mb-4 rounded-lg bg-status-success/10 px-4 py-3 text-sm text-status-success">
          {status}
        </div>
      )}

      <form onSubmit={submit} className="space-y-4">
        <InputField
          id="email"
          label="Email"
          type="email"
          value={data.email}
          onChange={(e) => setData('email', e.target.value)}
          autoComplete="email"
          autoFocus
          error={errors.email}
        />

        <PasswordField
          id="password"
          label="Password"
          value={data.password}
          onChange={(e) => setData('password', e.target.value)}
          autoComplete="current-password"
          error={errors.password}
        />

        <div className="flex items-center justify-between">
          <Checkbox
            id="remember"
            label="Remember me"
            checked={data.remember}
            onChange={(checked) => setData('remember', checked)}
          />
          {canResetPassword && (
            <Link
              href="/forgot-password"
              className="text-sm text-dark-secondary transition-colors hover:text-dark-primary"
            >
              Forgot password?
            </Link>
          )}
        </div>

        <Button type="submit" loading={processing} className="mt-2 w-full">
          {processing ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <div className="my-2 flex items-center gap-3">
        <div className="h-px flex-1 bg-dark-border" />
        <span className="text-xs text-dark-secondary">or</span>
        <div className="h-px flex-1 bg-dark-border" />
      </div>

      <a
        href="/auth/google"
        className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-dark-border bg-dark-primary px-4 py-2.5 text-sm font-medium text-dark-surface-3 transition-colors hover:bg-dark-primary/90"
      >
        <GoogleIcon />
        Continue with Google
      </a>

      <p className="mt-2 text-center text-sm text-dark-secondary">
        Don't have an account?{' '}
        <Link href="/register" className="font-medium text-dark-primary underline underline-offset-4">
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
}
