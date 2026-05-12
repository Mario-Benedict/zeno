import AuthLayout from '@/layouts/auth-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import type { FormEventHandler } from 'react';

interface LoginProps {
  status?: string;
  canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
  const { data, setData, post, processing, errors, reset } = useForm({
    email: '',
    password: '',
    remember: false as boolean,
  });

  const submit: FormEventHandler = (e) => {
    e.preventDefault();
    post('/login', { onFinish: () => reset('password') });
  };

  return (
    <AuthLayout title="Welcome back" description="Sign in to your account">
      <Head title="Log in" />

      {status && (
        <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-950/40 dark:text-green-400">
          {status}
        </div>
      )}

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-[#1b1b18] dark:text-[#EDEDEC]"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={data.email}
            onChange={(e) => setData('email', e.target.value)}
            autoComplete="email"
            autoFocus
            placeholder="you@example.com"
            className="mt-1.5 block w-full rounded-lg border border-[#e3e3e0] bg-white px-3 py-2 text-sm text-[#1b1b18] placeholder:text-[#706f6c] focus:border-[#1b1b18] focus:outline-none dark:border-[#3E3E3A] dark:bg-[#161615] dark:text-[#EDEDEC] dark:placeholder:text-[#A1A09A] dark:focus:border-[#EDEDEC]"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              {errors.email}
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-[#1b1b18] dark:text-[#EDEDEC]"
            >
              Password
            </label>
            {canResetPassword && (
              <Link
                href="/forgot-password"
                className="text-xs text-[#706f6c] hover:text-[#1b1b18] dark:text-[#A1A09A] dark:hover:text-[#EDEDEC]"
              >
                Forgot password?
              </Link>
            )}
          </div>
          <input
            id="password"
            type="password"
            value={data.password}
            onChange={(e) => setData('password', e.target.value)}
            autoComplete="current-password"
            placeholder="••••••••"
            className="mt-1.5 block w-full rounded-lg border border-[#e3e3e0] bg-white px-3 py-2 text-sm text-[#1b1b18] placeholder:text-[#706f6c] focus:border-[#1b1b18] focus:outline-none dark:border-[#3E3E3A] dark:bg-[#161615] dark:text-[#EDEDEC] dark:placeholder:text-[#A1A09A] dark:focus:border-[#EDEDEC]"
          />
          {errors.password && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              {errors.password}
            </p>
          )}
        </div>

        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={data.remember}
            onChange={(e) => setData('remember', e.target.checked)}
            className="h-4 w-4 rounded border-[#e3e3e0] accent-[#1b1b18] dark:border-[#3E3E3A]"
          />
          <span className="text-sm text-[#706f6c] dark:text-[#A1A09A]">
            Remember me
          </span>
        </label>

        <button
          type="submit"
          disabled={processing}
          className="w-full rounded-lg bg-[#1b1b18] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-black disabled:opacity-50 dark:bg-[#eeeeec] dark:text-[#1C1C1A] dark:hover:bg-white"
        >
          {processing ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[#706f6c] dark:text-[#A1A09A]">
        Don't have an account?{' '}
        <Link
          href="/register"
          className="font-medium text-[#1b1b18] underline underline-offset-4 dark:text-[#EDEDEC]"
        >
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
}
