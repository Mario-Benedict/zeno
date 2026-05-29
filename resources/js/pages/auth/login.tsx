import { Head, Link, useForm } from '@inertiajs/react';
import type { SubmitEventHandler } from 'react';
import Button from '@/components/shared/Button';
import Checkbox from '@/components/shared/Checkbox';
import FloatInputField from '@/components/shared/FloatInputField';
import GoogleButton from '@/components/shared/GoogleButton';
import PasswordField from '@/components/shared/PasswordField';
import AuthLayout from '@/layouts/AuthLayout';

interface LoginProps {
  status?: string;
  canResetPassword: boolean;
}

const Login = ({ status, canResetPassword }: LoginProps) => {
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
    <AuthLayout
      title="Welcome back"
      description="Sign in to your account to continue"
    >
      <Head title="Log in" />

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

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-dark-border" />
        <span className="text-xs text-dark-secondary">or</span>
        <div className="h-px flex-1 bg-dark-border" />
      </div>

      <GoogleButton />

      <p className="mt-6 text-center text-sm text-dark-secondary">
        Don't have an account?{' '}
        <Link
          href="/register"
          className="font-medium text-dark-primary underline underline-offset-4"
        >
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
};

export default Login;
