import { Head, router, useForm, usePage } from '@inertiajs/react';
import type { FormEventHandler } from 'react';
import Button from '@/components/shared/Button';
import AuthLayout from '@/layouts/AuthLayout';

interface VerifyEmailProps {
  status?: string;
}

const VerifyEmail = ({ status }: VerifyEmailProps) => {
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
        <div className="mb-4 rounded-lg bg-status-success/10 px-4 py-3 text-sm text-status-success">
          A new verification link has been sent to your email address.
        </div>
      )}

      <p className="text-sm text-dark-secondary">
        Thanks for signing up! Before getting started, please verify your email
        address by clicking on the link we just emailed to you. If you didn't
        receive the email, we'll gladly send you another.
      </p>

      <form onSubmit={resend} className="mt-6 space-y-3">
        <Button type="submit" loading={processing} className="w-full">
          {processing ? 'Sending…' : 'Resend verification email'}
        </Button>

        <button
          type="button"
          onClick={() => router.post('/logout')}
          className="w-full rounded-lg border border-dark-border px-4 py-2.5 text-sm font-medium text-dark-secondary transition-colors hover:border-dark-border-focus hover:text-dark-primary"
        >
          Log out
        </button>
      </form>
    </AuthLayout>
  );
};

export default VerifyEmail;
