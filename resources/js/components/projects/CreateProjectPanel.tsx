import { router } from '@inertiajs/react';
import axios from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';
import ProjectController from '@/actions/App/Http/Controllers/ProjectController';

interface CreateProjectPanelProps {
  open: boolean;
  onClose: () => void;
}

const SLUG_CHAR_RE = /^[a-zA-Z0-9\- ]*$/;
const NO_DBL_SPACE = / {2}/;
const RANDOM_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';

const randomSuffix = (len = 5) =>
  Array.from(
    { length: len },
    () => RANDOM_CHARS[Math.floor(Math.random() * RANDOM_CHARS.length)],
  ).join('');

const toSlug = (name: string) => name.trim().toLowerCase().replace(/\s+/g, '-');

const XIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const CreateProjectPanel = ({ open, onClose }: CreateProjectPanelProps) => {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    project_name?: string;
    project_slug?: string;
  }>({});
  const checkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    } else {
      // Reset form when panel closes
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName('');
      setSlug('');
      setSlugAvailable(null);
      setErrors({});
    }
  }, [open]);

  const checkSlugAvailability = useCallback(async (candidate: string) => {
    if (!candidate) {
      setSlugAvailable(null);
      return candidate;
    }

    setChecking(true);
    try {
      const { data } = await axios.get<{ available: boolean }>(
        ProjectController.checkSlug.url({ query: { slug: candidate } }),
      );

      const finalSlug = data.available
        ? candidate
        : `${candidate}-${randomSuffix()}`;
      setSlug(finalSlug);
      setSlugAvailable(true);
      return finalSlug;
    } catch {
      return candidate;
    } finally {
      setChecking(false);
    }
  }, []);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;

    if (!SLUG_CHAR_RE.test(raw) || NO_DBL_SPACE.test(raw)) return;

    setName(raw);
    setErrors((prev) => ({ ...prev, project_name: undefined }));

    const derived = toSlug(raw);
    setSlug(derived);
    setSlugAvailable(null);

    if (checkTimer.current) clearTimeout(checkTimer.current);

    if (!derived) return;

    checkTimer.current = setTimeout(() => {
      void checkSlugAvailability(derived);
    }, 350);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = name.trim();
    if (!trimmed) {
      setErrors({ project_name: 'Project name is required.' });
      return;
    }

    let finalSlug = slug;

    if (!finalSlug || slugAvailable === null) {
      finalSlug = await checkSlugAvailability(toSlug(trimmed));
    }

    setSubmitting(true);

    router.post(
      '/projects',
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
        aria-label="Create a project"
        className={`fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-dark-surface-1 shadow-2xl transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Panel header */}
        <div className="flex h-12 items-center gap-3 border-b border-dark-border px-6">
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-dark-secondary transition-colors hover:bg-white/[0.07] hover:text-dark-primary"
            aria-label="Close panel"
          >
            <XIcon />
          </button>
          <span className="text-sm font-semibold text-dark-primary">
            Create a project
          </span>
        </div>

        {/* Panel body */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col justify-between p-10"
        >
          <div className="flex flex-col items-center gap-8">
            <h1 className="text-center text-xl font-semibold text-dark-primary">
              Let's start with a name for your project.
            </h1>

            <div className="w-full max-w-sm">
              <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={handleNameChange}
                placeholder="Project Title"
                maxLength={50}
                className="w-full border-0 border-b border-dark-border bg-transparent pb-2 text-center text-base text-dark-primary outline-none placeholder:text-dark-secondary focus:border-dark-primary"
              />

              {/* Slug preview */}
              <div className="mt-3 flex justify-center">
                {slug ? (
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      checking
                        ? 'bg-dark-surface-3 text-dark-secondary'
                        : slugAvailable
                          ? 'bg-dark-surface-3 text-dark-secondary'
                          : 'bg-dark-surface-3 text-dark-secondary'
                    }`}
                  >
                    {checking && (
                      <span className="inline-block h-2.5 w-2.5 animate-spin rounded-full border border-dark-border border-t-transparent" />
                    )}
                    {slug}
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-dark-surface-3 px-3 py-1 text-xs text-dark-secondary">
                    project-slug
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
              disabled={submitting || checking || !name.trim()}
              className="rounded-lg bg-dark-primary px-5 py-2 text-sm font-semibold text-dark-surface-1 transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {submitting ? 'Creating…' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default CreateProjectPanel;
