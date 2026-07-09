import { useEffect, useRef, useState } from 'react';
import { TagBadge } from '@/components/kanban';
import { useTranslation } from '@/hooks/useTranslation';
import type { CardLabel } from '@/types/kanban';
import CheckIcon from '@public/icons/small/check.svg';

interface EventLabelPickerProps {
  cardLabels: CardLabel[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  /** See `SelectPopover`'s `align` prop — same reasoning. */
  align?: 'left' | 'right';
}

/**
 * Multi-select over the project's real Kanban labels, anchored directly
 * below its own trigger (see `SelectPopover` for why — same reasoning
 * applies here). Minus the "create new label" flow `LabelPopover` (the
 * Kanban card's label picker) has: labels are project-wide, so Calendar
 * only picks from what already exists rather than minting its own.
 */
export const EventLabelPicker = ({
  cardLabels,
  selectedIds,
  onChange,
  align = 'left',
}: EventLabelPickerProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const toggle = (id: string) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((existing) => existing !== id)
        : [...selectedIds, id],
    );
  };

  const selectedLabels = cardLabels.filter((l) =>
    selectedIds.includes(l.card_label_id),
  );

  return (
    <div ref={ref} className="relative">
      <label className="mb-1 block text-xsmall tracking-wider text-white/30 uppercase">
        {t('calendar.labels')}
      </label>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-left text-xsmall transition-all ${
          selectedLabels.length > 0
            ? 'border-dark-border bg-dark-surface-2 hover:border-dark-border-focus'
            : 'border-dark-border bg-dark-surface-2 text-white/25 hover:border-dark-border-focus hover:text-white/40'
        }`}
      >
        {selectedLabels.length > 0 ? (
          selectedLabels.map((label) => (
            <TagBadge
              key={label.card_label_id}
              label={label.card_label_name}
              colorHex={label.card_label_color_hex}
            />
          ))
        ) : (
          <span>{t('calendar.selectLabels')}</span>
        )}
      </button>

      {open && (
        <div
          className={`absolute top-full z-50 mt-1.5 w-64 overflow-hidden rounded-2xl border border-dark-border bg-dark-surface-1 shadow-2xl ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          <div className="border-b border-dark-border px-4 py-3 text-small font-semibold text-white/80">
            {t('calendar.labels')}
          </div>
          <div className="scrollbar-app max-h-72 overflow-y-auto p-2">
            {cardLabels.length === 0 && (
              <p className="px-2.5 py-2 text-xsmall text-white/30 italic">
                {t('calendar.noLabelsInProject')}
              </p>
            )}
            {cardLabels.map((label) => {
              const active = selectedIds.includes(label.card_label_id);

              return (
                <button
                  key={label.card_label_id}
                  type="button"
                  onClick={() => toggle(label.card_label_id)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xsmall transition ${
                    active ? 'bg-white/5' : 'hover:bg-white/5'
                  }`}
                >
                  <span
                    className="h-3 w-3 shrink-0 rounded-sm"
                    style={{ backgroundColor: label.card_label_color_hex }}
                  />
                  <span className="min-w-0 flex-1 truncate text-white/70">
                    {label.card_label_name}
                  </span>
                  {active && (
                    <CheckIcon className="h-3 w-3 shrink-0 text-accent-blue" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
