import { useEffect } from 'react';
import type { ReactNode } from 'react';

type Tone = 'danger' | 'primary';

interface Props {
  /** Modal heading, e.g. "Delete Board". */
  title: string;
  /** Body copy — string or rich nodes (e.g. a bolded entity name). */
  description: ReactNode;
  /** Confirm button label. Defaults to "Confirm". */
  confirmLabel?: string;
  /** Cancel button label. Defaults to "Cancel". */
  cancelLabel?: string;
  /** Visual tone of the confirm button. Defaults to "danger". */
  tone?: Tone;
  onConfirm: () => void;
  onCancel: () => void;
}

const confirmToneClasses: Record<Tone, string> = {
  danger:
    'border border-accent-red/20 bg-accent-red/15 text-accent-red hover:bg-accent-red/30',
  primary:
    'border border-accent-blue/20 bg-accent-blue/15 text-accent-blue hover:bg-accent-blue/30',
};

/**
 * Shared confirmation dialog used across features (LLM chat, kanban, …).
 *
 * Renders a centered modal over a blurred backdrop. Clicking the backdrop or
 * pressing Escape cancels; the confirm button is auto-focused for quick
 * keyboard confirmation.
 */
const ConfirmModal = ({
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  onConfirm,
  onCancel,
}: Props) => {
  // Close on Escape.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };

    document.addEventListener('keydown', onKeyDown);

    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-sm rounded-xl border border-dark-border bg-dark-surface-2 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-2 text-normal font-semibold text-white">{title}</h3>
        <p className="mb-6 text-small leading-relaxed text-white/60">
          {description}
        </p>
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-small font-medium text-white/50 transition hover:bg-white/10 hover:text-white"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            autoFocus
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-small font-medium transition ${confirmToneClasses[tone]}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
