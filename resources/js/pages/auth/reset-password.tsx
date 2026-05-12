import AuthLayout from '@/layouts/auth-layout';
import { Head, useForm } from '@inertiajs/react';
import type { FormEventHandler } from 'react';

interface ResetPasswordProps {
  token: string;
  email: string;
}

export default function ResetPassword({ token, email }: ResetPasswordProps) {
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
            className="mt-1.5 block w-full rounded-lg border border-[#e3e3e0] bg-white px-3 py-2 text-sm text-[#1b1b18] placeholder:text-[#706f6c] focus:border-[#1b1b18] focus:outline-none dark:border-[#3E3E3A] dark:bg-[#161615] dark:text-[#EDEDEC] dark:placeholder:text-[#A1A09A] dark:focus:border-[#EDEDEC]"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              {errors.email}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-[#1b1b18] dark:text-[#EDEDEC]"
          >
            New password
          </label>
          <input
            id="password"
            type="password"
            value={data.password}
            onChange={(e) => setData('password', e.target.value)}
            autoComplete="new-password"
            autoFocus
            placeholder="Min. 8 characters"
            className="mt-1.5 block w-full rounded-lg border border-[#e3e3e0] bg-white px-3 py-2 text-sm text-[#1b1b18] placeholder:text-[#706f6c] focus:border-[#1b1b18] focus:outline-none dark:border-[#3E3E3A] dark:bg-[#161615] dark:text-[#EDEDEC] dark:placeholder:text-[#A1A09A] dark:focus:border-[#EDEDEC]"
          />
          {errors.password && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              {errors.password}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="password_confirmation"
            className="block text-sm font-medium text-[#1b1b18] dark:text-[#EDEDEC]"
          >
            Confirm new password
          </label>
          <input
            id="password_confirmation"
            type="password"
            value={data.password_confirmation}
            onChange={(e) => setData('password_confirmation', e.target.value)}
            autoComplete="new-password"
            placeholder="••••••••"
            className="mt-1.5 block w-full rounded-lg border border-[#e3e3e0] bg-white px-3 py-2 text-sm text-[#1b1b18] placeholder:text-[#706f6c] focus:border-[#1b1b18] focus:outline-none dark:border-[#3E3E3A] dark:bg-[#161615] dark:text-[#EDEDEC] dark:placeholder:text-[#A1A09A] dark:focus:border-[#EDEDEC]"
          />
          {errors.password_confirmation && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              {errors.password_confirmation}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={processing}
          className="w-full rounded-lg bg-[#1b1b18] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-black disabled:opacity-50 dark:bg-[#eeeeec] dark:text-[#1C1C1A] dark:hover:bg-white"
        >
          {processing ? 'Resetting…' : 'Reset password'}
        </button>
      </form>
    </AuthLayout>
  );
}
