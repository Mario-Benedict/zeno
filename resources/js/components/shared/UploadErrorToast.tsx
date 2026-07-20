import { useEffect, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { UPLOAD_TOO_LARGE_EVENT } from '@/lib/uploadEvents';
import CancelIcon from '@public/icons/small/cancel.svg';

const UploadErrorToast = () => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    const show = () => {
      setVisible(true);
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => setVisible(false), 6000);
    };

    window.addEventListener(UPLOAD_TOO_LARGE_EVENT, show);

    return () => {
      window.removeEventListener(UPLOAD_TOO_LARGE_EVENT, show);
      if (timeout) clearTimeout(timeout);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      role="alert"
      className="fixed top-4 right-4 z-[100] flex w-full max-w-sm items-start gap-3 rounded-xl border border-status-error/40 bg-dark-surface-2 p-4 shadow-2xl"
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-status-error/15 text-small font-bold text-status-error">
        !
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-small font-semibold text-dark-primary">
          {t('common.fileTooLargeTitle')}
        </p>
        <p className="mt-0.5 text-xsmall leading-relaxed text-dark-secondary">
          {t('common.fileTooLargeBody')}
        </p>
      </div>
      <button
        type="button"
        onClick={() => setVisible(false)}
        aria-label={t('common.close')}
        className="text-dark-secondary transition-colors hover:text-dark-primary"
      >
        <CancelIcon className="h-3 w-3" />
      </button>
    </div>
  );
};

export default UploadErrorToast;
