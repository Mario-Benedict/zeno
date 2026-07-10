import { useRef, useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import type { CardLabel } from '@/types/kanban';
import { LABEL_COLORS, getContrastColor } from '@/utils/kanban';
import CloseIcon from '@public/icons/small/cancel.svg';
import CheckIcon from '@public/icons/small/check.svg';

interface LabelPopoverProps {
  cardLabels: CardLabel[];
  activeLabels: CardLabel[];
  onToggle: (label: CardLabel) => void;
  onDelete: (labelId: string) => void;
  onClose: () => void;
  creatingLabel: boolean;
  setCreatingLabel: (v: boolean) => void;
  newName: string;
  setNewName: (v: string) => void;
  newColor: string | null;
  setNewColor: (v: string | null) => void;
  saving: boolean;
  onCreate: () => void;
}

export const LabelPopover = ({
  cardLabels,
  activeLabels,
  onToggle,
  onDelete,
  onClose,
  creatingLabel,
  setCreatingLabel,
  newName,
  setNewName,
  newColor,
  setNewColor,
  saving,
  onCreate,
}: LabelPopoverProps) => {
  const { t } = useTranslation();
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={popoverRef}
      className="fixed top-1/2 left-1/2 z-50 w-64 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-dark-border bg-dark-surface-1 shadow-2xl"
    >
      {!creatingLabel ? (
        <>
          <div className="flex items-center justify-between border-b border-dark-border px-4 py-3">
            <span className="text-xsmall font-semibold text-white/60">
              {t('kanban.labelsLabel')}
            </span>
            <button
              onClick={onClose}
              className="cursor-pointer text-dark-primary transition hover:text-dark-secondary"
            >
              <CloseIcon />
            </button>
          </div>

          <div className="scrollbar-app max-h-52 space-y-0.5 overflow-y-auto p-2">
            {cardLabels.length === 0 && (
              <p className="py-4 text-center text-xsmall text-white/20">
                {t('kanban.noLabelsYet')}
              </p>
            )}
            {cardLabels.map((label) => {
              const active = activeLabels.some(
                (l) => l.card_label_id === label.card_label_id,
              );
              const hex = label.card_label_color_hex || '#7B7B7B';

              return (
                <div
                  key={label.card_label_id}
                  className="group/lbl flex items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-white/4"
                >
                  <button
                    onClick={() => onToggle(label)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-all ${
                        active
                          ? 'border-transparent bg-dark-surface-3'
                          : 'border-dark-secondary bg-transparent'
                      }`}
                    >
                      {active && (
                        <CheckIcon className="h-2.5 w-2.5 text-white" />
                      )}
                    </span>
                    <span
                      className="h-5 w-5 shrink-0 rounded-sm"
                      style={{ backgroundColor: hex }}
                    />
                    <span className="flex-1 truncate text-xsmall text-white/60">
                      {label.card_label_name}
                    </span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(label.card_label_id);
                    }}
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-xsmall text-white/20 opacity-0 transition group-hover/lbl:opacity-100 hover:bg-accent-red/10 hover:text-accent-red"
                    title={t('kanban.deleteLabel')}
                  >
                    <CloseIcon />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="border-t border-dark-border px-2 pt-1 pb-2">
            <button
              onClick={() => setCreatingLabel(true)}
              className="flex w-full items-center gap-2 rounded-lg border border-dark-border bg-dark-surface-2 px-3 py-2 text-xsmall text-white/40 transition hover:bg-dark-surface-3 hover:text-white/60"
            >
              <span className="text-normal leading-none">+</span>
              <span>{t('kanban.createNewLabel')}</span>
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 border-b border-dark-border px-4 py-3">
            <button
              onClick={() => {
                setCreatingLabel(false);
                setNewName('');
                setNewColor(null);
              }}
              className="text-small text-white/30 transition hover:text-white/60"
            >
              ←
            </button>
            <span className="text-xsmall font-semibold text-white/60">
              {t('kanban.createLabel')}
            </span>
          </div>

          <div className="space-y-4 p-4">
            <div
              className="flex w-fit items-center rounded-full px-3 py-1 transition-all"
              style={
                newColor
                  ? { backgroundColor: newColor }
                  : { backgroundColor: 'rgba(255,255,255,0.04)' }
              }
            >
              <span
                className="truncate text-xsmall font-semibold"
                style={{
                  color: newColor
                    ? getContrastColor(newColor)
                    : 'rgba(255,255,255,0.3)',
                }}
              >
                {newName || t('kanban.labelPreview')}
              </span>
            </div>

            <div>
              <label className="mb-1.5 block text-xsmall tracking-wider text-white/30 uppercase">
                {t('kanban.nameLabel')}
              </label>
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onCreate();
                }}
                placeholder={t('kanban.labelNamePlaceholder')}
                className="w-full rounded-lg border border-dark-border bg-dark-surface-2 px-3 py-2 text-small text-white placeholder-white/20 transition focus:border-dark-border-focus focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xsmall tracking-wider text-white/30 uppercase">
                {t('kanban.colorLabel')}
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {LABEL_COLORS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setNewColor(c.hex)}
                    className="relative aspect-square w-full rounded-lg transition-all"
                    style={{ backgroundColor: c.hex }}
                    title={t(c.labelKey)}
                  >
                    {newColor === c.hex && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <CheckIcon className="h-3 w-3 text-white drop-shadow" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={onCreate}
                disabled={!newName.trim() || !newColor || saving}
                className="hover:bg-opacity-90 flex-1 rounded-lg bg-accent-blue px-3 py-2 text-xsmall font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-30"
              >
                {saving ? t('kanban.creating') : t('kanban.create')}
              </button>
              <button
                onClick={() => {
                  setCreatingLabel(false);
                  setNewName('');
                  setNewColor(null);
                }}
                className="rounded-lg border border-dark-border px-3 py-2 text-xsmall text-white/40 transition hover:bg-white/5 hover:text-white"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
