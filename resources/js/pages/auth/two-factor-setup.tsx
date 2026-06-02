import { Head, useForm, usePage } from '@inertiajs/react';
import type { FormEventHandler } from 'react';
import { useState } from 'react';
import Button from '@/components/shared/Button';
import AppLayout from '@/layouts/AppLayout';

interface TwoFactorSetupProps {
  enabled: boolean;
  secret: string | null;
  qrCodeUrl: string | null;
  status: string | null;
}

const StatusBadge = ({ enabled }: { enabled: boolean }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
      enabled
        ? 'bg-status-success/10 text-status-success'
        : 'bg-dark-surface-3 text-dark-secondary'
    }`}
  >
    <span
      className={`h-1.5 w-1.5 rounded-full ${enabled ? 'bg-status-success' : 'bg-dark-secondary'}`}
    />
    {enabled ? 'Enabled' : 'Disabled'}
  </span>
);

const TwoFactorSetup = ({
  enabled,
  secret,
  qrCodeUrl,
  status,
}: TwoFactorSetupProps) => {
  const { props: pageProps } = usePage<any>();
  const project = pageProps.project;

  const [copied, setCopied] = useState(false);

  const { post: generate, processing: generating } = useForm({});
  const { post: disablePost, processing: disabling } = useForm({});
  const { data, setData, post, processing, errors, reset } = useForm({
    code: '',
  });

  const handleGenerate: FormEventHandler = (e) => {
    e.preventDefault();
    generate('/two-factor/generate');
  };

  const handleVerify: FormEventHandler = (e) => {
    e.preventDefault();
    post('/two-factor/verify', { onSuccess: () => reset('code') });
  };

  const handleDisable: FormEventHandler = (e) => {
    e.preventDefault();
    disablePost('/two-factor/disable');
  };

  const copySecret = () => {
    if (!secret) return;
    navigator.clipboard.writeText(secret).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <AppLayout project={project}>
      <Head title="2FA Debug Setup" />

      <div className="mx-auto w-full max-w-xl space-y-6 px-6 py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-dark-primary">
              Two-Factor Authentication
            </h1>
            <p className="mt-0.5 text-sm text-dark-secondary">
              Debug setup — scan the QR code with your authenticator app.
            </p>
          </div>
          <StatusBadge enabled={enabled} />
        </div>

        {status === '2fa-enabled' && (
          <div className="rounded-lg bg-status-success/10 px-4 py-3 text-sm text-status-success">
            2FA enabled successfully. It will be required on your next login.
          </div>
        )}
        {status === '2fa-disabled' && (
          <div className="rounded-lg bg-dark-surface-3 px-4 py-3 text-sm text-dark-secondary">
            2FA has been disabled.
          </div>
        )}

        {/* Step 1 — Generate secret */}
        <div className="space-y-4 rounded-xl border border-dark-border bg-dark-surface-2 p-5">
          <p className="text-sm font-medium text-dark-primary">
            Step 1 — Generate a secret
          </p>

          {!secret ? (
            <form onSubmit={handleGenerate}>
              <Button type="submit" loading={generating} className="w-full">
                Generate Secret
              </Button>
            </form>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-lg border border-dark-border bg-dark-surface-3 px-3 py-2">
                <code className="flex-1 font-mono text-xs break-all text-dark-primary">
                  {secret}
                </code>
                <button
                  type="button"
                  onClick={copySecret}
                  className="shrink-0 text-xs text-dark-secondary transition-colors hover:text-dark-primary"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="text-xs text-dark-secondary">
                You can enter this secret manually in any TOTP app (Google
                Authenticator, Authy, etc.).
              </p>
              <form onSubmit={handleGenerate}>
                <button
                  type="submit"
                  disabled={generating}
                  className="text-xs text-dark-secondary underline underline-offset-4 transition-colors hover:text-dark-primary disabled:opacity-50"
                >
                  Regenerate secret
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Step 2 — Scan QR code */}
        {qrCodeUrl && (
          <div className="space-y-4 rounded-xl border border-dark-border bg-dark-surface-2 p-5">
            <p className="text-sm font-medium text-dark-primary">
              Step 2 — Scan this QR code
            </p>
            <div className="flex justify-center">
              <div className="rounded-xl bg-white p-3">
                <img
                  src={qrCodeUrl}
                  alt="2FA QR Code"
                  width={200}
                  height={200}
                  className="block"
                />
              </div>
            </div>
            <p className="text-center text-xs text-dark-secondary">
              Open Google Authenticator, Authy, or any TOTP app and scan the
              code above.
            </p>
          </div>
        )}

        {/* Step 3 — Verify + enable */}
        {secret && (
          <div className="space-y-4 rounded-xl border border-dark-border bg-dark-surface-2 p-5">
            <div>
              <p className="text-sm font-medium text-dark-primary">
                Step 3 — Verify &amp; {enabled ? 'test' : 'enable'}
              </p>
              <p className="mt-0.5 text-xs text-dark-secondary">
                {enabled
                  ? 'Enter a code to confirm your authenticator app is still working.'
                  : 'Enter the 6-digit code from your app to confirm it is working, then enable 2FA.'}
              </p>
            </div>

            <form onSubmit={handleVerify} className="space-y-3">
              <div>
                <input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={data.code}
                  onChange={(e) =>
                    setData('code', e.target.value.replace(/\D/g, ''))
                  }
                  placeholder="000000"
                  autoComplete="one-time-code"
                  className="h-11 w-full rounded-lg border border-dark-border bg-dark-surface-3 px-3 text-center font-mono text-lg tracking-[0.4em] text-dark-primary transition-colors outline-none placeholder:text-dark-secondary/40 focus:border-dark-border-focus"
                />
                {errors.code && (
                  <p className="mt-1.5 text-xs text-status-error">
                    {errors.code}
                  </p>
                )}
              </div>

              <Button type="submit" loading={processing} className="w-full">
                {enabled ? 'Test Code' : 'Verify & Enable 2FA'}
              </Button>
            </form>
          </div>
        )}

        {/* Disable */}
        {enabled && (
          <div className="space-y-3 rounded-xl border border-dark-border bg-dark-surface-2 p-5">
            <p className="text-sm font-medium text-dark-primary">Disable 2FA</p>
            <p className="text-xs text-dark-secondary">
              This removes the 2FA requirement. You can re-enable it at any
              time.
            </p>
            <form onSubmit={handleDisable}>
              <button
                type="submit"
                disabled={disabling}
                className="w-full rounded-lg border border-status-error/40 px-4 py-2.5 text-sm font-medium text-status-error transition-colors hover:bg-status-error/10 disabled:opacity-50"
              >
                {disabling ? 'Disabling…' : 'Disable 2FA'}
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  );
};

export default TwoFactorSetup;
