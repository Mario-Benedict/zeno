import { router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, SyntheticEvent } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { accountPath } from '@/lib/accountRoutes';
import { toSlug } from '@/lib/projectSlug';
import XIcon from '@public/icons/small/cancel.svg';

interface CreateProjectPanelProps {
  open: boolean;
  onClose: () => void;
}

const SLUG_CHAR_RE = /^[a-zA-Z0-9\- ]*$/;
const NO_DBL_SPACE = / {2}/;

const CreateProjectPanel = ({ open, onClose }: CreateProjectPanelProps) => {
  const { account } = usePage().props;
  const { t } = useTranslation();
  const accountIndex = account.index;
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    project_name?: string;
    project_slug?: string;
  }>({});
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    } else {
      // Reset form when panel closes
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName('');
      setSlug('');
      setErrors({});
    }
  }, [open]);

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;

    if (!SLUG_CHAR_RE.test(raw) || NO_DBL_SPACE.test(raw)) return;

    setName(raw);
    setErrors((prev) => ({ ...prev, project_name: undefined }));

    const derived = toSlug(raw);
    setSlug(derived);
  };

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault();

    const trimmed = name.trim();
    if (!trimmed) {
      setErrors({
        project_name: t('projectSettingsTabs.projectNameRequired'),
      });
      return;
    }

    const finalSlug = slug || toSlug(trimmed);

    setSubmitting(true);

    router.post(
      accountPath(accountIndex, '/projects'),
      { project_name: trimmed, project_slug: finalSlug },
      {
        onError: (errs) => {
          setErrors(errs as typeof errors);
          setSubmitting(false);
        },
        onFinish: () => setSubmitting(false),
      },
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sliding panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('projectSettingsTabs.createAProject')}
        className={`fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-dark-surface-1 shadow-2xl transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Panel header */}
        <div className="flex h-12 items-center gap-3 border-b border-dark-border px-6">
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-dark-secondary transition-colors hover:bg-white/[0.07] hover:text-dark-primary"
            aria-label={t('projectSettingsTabs.closePanel')}
          >
            <XIcon />
          </button>
          <span className="text-sm font-semibold text-dark-primary">
            {t('projectSettingsTabs.createAProject')}
          </span>
        </div>

        {/* Panel body */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col justify-between overflow-y-auto p-6 sm:p-10"
        >
          <div className="flex flex-col items-center gap-8">
            <h1 className="text-center text-xl font-semibold text-dark-primary">
              {t('projectSettingsTabs.createProjectHeading')}
            </h1>

            <div className="w-full max-w-sm">
              <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={handleNameChange}
                placeholder={t('projectSettingsTabs.projectTitlePlaceholder')}
                maxLength={50}
                className="w-full border-0 border-b border-dark-border bg-transparent pb-2 text-center text-base text-dark-primary outline-none placeholder:text-dark-secondary focus:border-dark-primary"
              />

              {/* Slug preview */}
              <div className="mt-3 flex justify-center">
                {slug ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-dark-surface-3 px-3 py-1 text-xs font-medium text-dark-secondary transition-colors">
                    {slug}
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-dark-surface-3 px-3 py-1 text-xs text-dark-secondary">
                    {t('projectSettingsTabs.projectSlugPlaceholder')}
                  </span>
                )}
              </div>

              {errors.project_name && (
                <p className="mt-2 text-center text-xs text-status-error">
                  {errors.project_name}
                </p>
              )}
              {errors.project_slug && (
                <p className="mt-2 text-center text-xs text-status-error">
                  {errors.project_slug}
                </p>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="rounded-lg bg-dark-primary px-5 py-2 text-sm font-semibold text-dark-surface-1 transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {submitting
                ? t('projectSettingsTabs.creating')
                : t('projectSettingsTabs.createProject')}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default CreateProjectPanel;
