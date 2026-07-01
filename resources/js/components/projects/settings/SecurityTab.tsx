import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import OtpInput from '@/components/shared/OtpInput';

const ShieldIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const SecurityTab = ({
  twoFactor,
}: {
  twoFactor: { enabled: boolean; qrCodeUrl: string | null };
}) => {
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(6).fill(''));
  const [generating, setGenerating] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [disabling, setDisabling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setOtpDigits(Array(6).fill(''));
    setError(null);
  }, [twoFactor.qrCodeUrl, twoFactor.enabled]);

  const generate = () => {
    setGenerating(true);
    router.post('/two-factor/generate', {}, {
      preserveScroll: true,
      onFinish: () => setGenerating(false),
    });
  };

  const verify = () => {
    const code = otpDigits.join('');
    if (code.length < 6) return;
    setVerifying(true);
    setError(null);
    router.post('/two-factor/verify', { code }, {
      preserveScroll: true,
      onError: (errs) => { setError((errs.code as string | undefined) ?? 'Invalid code.'); },
      onFinish: () => setVerifying(false),
    });
  };

  const disable = () => {
    setDisabling(true);
    router.post('/two-factor/disable', {}, {
      preserveScroll: true,
      onFinish: () => setDisabling(false),
    });
  };

  return (
    <div>
      <h3 className="mb-5 text-normal font-semibold text-dark-primary">Security</h3>

      <div className="rounded-lg border border-dark-border bg-dark-surface-1 p-5">
        <div className="mb-5 flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-dark-surface-3 text-dark-secondary">
            <ShieldIcon />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-small font-semibold text-dark-primary">Two-factor authentication</p>
              {twoFactor.enabled ? (
                <span className="rounded-full bg-status-success/15 px-2 py-0.5 text-micro font-semibold text-status-success">
                  Enabled
                </span>
              ) : (
                <span className="rounded-full bg-dark-surface-3 px-2 py-0.5 text-micro font-semibold text-dark-secondary">
                  Disabled
                </span>
              )}
            </div>
            <p className="mt-1 text-xsmall leading-relaxed text-dark-secondary">
              Protect your account with a time-based one-time password (TOTP) from an authenticator app.
            </p>
          </div>
        </div>

        {twoFactor.enabled && (
          <button
            type="button"
            onClick={disable}
            disabled={disabling}
            className="rounded-lg border border-status-error/30 bg-status-error/10 px-4 py-2 text-small font-semibold text-status-error transition-colors hover:bg-status-error/20 disabled:opacity-40"
          >
            {disabling ? 'Disabling…' : 'Disable 2FA'}
          </button>
        )}

        {!twoFactor.enabled && twoFactor.qrCodeUrl && (
          <div className="space-y-5">
            <div>
              <p className="mb-1 text-small font-semibold text-dark-primary">Step 1 — Scan the QR code</p>
              <p className="mb-4 text-xsmall text-dark-secondary">
                Open your authenticator app (Google Authenticator, Authy, 1Password, etc.) and scan the code below.
              </p>
              <div className="flex justify-center">
                <div className="rounded-xl border border-dark-border bg-white p-3">
                  <img src={twoFactor.qrCodeUrl} alt="2FA QR code" className="h-40 w-40 rounded-md" />
                </div>
              </div>
            </div>
            <div>
              <p className="mb-1 text-small font-semibold text-dark-primary">Step 2 — Enter the 6-digit code</p>
              <p className="mb-4 text-xsmall text-dark-secondary">
                Enter the code shown in your authenticator app to confirm the setup.
              </p>
              <OtpInput value={otpDigits} onChange={setOtpDigits} autoFocus={false} />
              {error && <p className="mt-3 text-center text-xsmall text-status-error">{error}</p>}
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={verify}
                  disabled={verifying || otpDigits.join('').length < 6}
                  className="rounded-lg bg-dark-primary px-6 py-2.5 text-small font-semibold text-dark-surface-1 transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  {verifying ? 'Verifying…' : 'Verify & enable'}
                </button>
              </div>
            </div>
          </div>
        )}

        {!twoFactor.enabled && !twoFactor.qrCodeUrl && (
          <button
            type="button"
            onClick={generate}
            disabled={generating}
            className="rounded-lg bg-dark-primary px-4 py-2 text-small font-semibold text-dark-surface-1 transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {generating ? 'Generating…' : 'Set up 2FA'}
          </button>
        )}
      </div>
    </div>
  );
};

export default SecurityTab;
