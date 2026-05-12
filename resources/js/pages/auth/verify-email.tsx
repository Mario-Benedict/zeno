import AuthLayout from '@/layouts/auth-layout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import type { FormEventHandler } from 'react';

interface VerifyEmailProps {
  status?: string;
}

export default function VerifyEmail({ status }: VerifyEmailProps) {
  const { auth } = usePage().props;
  const { post, processing } = useForm({});

  const resend: FormEventHandler = (e) => {
    e.preventDefault();
    post('/email/verification-notification');
  };

  const sent = status === 'verification-link-sent';

  return (
    <AuthLayout
      title="Verify your email"
      description={`We sent a verification link to ${auth.user?.email}`}
    >
      <Head title="Email Verification" />

      {sent && (
        <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-950/40 dark:text-green-400">
          A new verification link has been sent to your email address.
        </div>
      )}

      <p className="text-sm text-[#706f6c] dark:text-[#A1A09A]">
        Thanks for signing up! Before getting started, please verify your email
        address by clicking on the link we just emailed to you. If you didn't
        receive the email, we'll gladly send you another.
      </p>

      <form onSubmit={resend} className="mt-6">
        <button
          type="submit"
          disabled={processing}
          className="w-full rounded-lg bg-[#1b1b18] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-black disabled:opacity-50 dark:bg-[#eeeeec] dark:text-[#1C1C1A] dark:hover:bg-white"
        >
          {processing ? 'Sending…' : 'Resend verification email'}
        </button>
      </form>

      <button
        type="button"
        onClick={() => router.post('/logout')}
        className="mt-3 w-full rounded-lg border border-[#e3e3e0] px-4 py-2.5 text-sm font-medium text-[#706f6c] transition hover:border-[#1b1b18] hover:text-[#1b1b18] dark:border-[#3E3E3A] dark:text-[#A1A09A] dark:hover:border-[#EDEDEC] dark:hover:text-[#EDEDEC]"
      >
        Log out
      </button>
    </AuthLayout>
  );
}
