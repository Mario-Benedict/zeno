import { useEffect, useRef, useState } from 'react';
import CheckIcon from '@public/icons/small/check.svg';

export interface SelectPopoverOption<T extends string | number> {
  value: T;
  label: string;
  /** Optional colour dot rendered before the label (e.g. a member's color). */
  dotColor?: string;
}

interface SelectPopoverProps<T extends string | number> {
  label: string;
  value: T;
  options: SelectPopoverOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
  placeholder?: string;
  /** Which edge of the trigger the popover hangs from. Use 'right' for a
   * field in the right-hand column of a 2-column form grid, so the popover
   * opens toward the middle of the form instead of off the far edge. */
  align?: 'left' | 'right';
}

/**
 * A single-select dropdown with an accent-blue selected row instead of a
 * native `<select>`, anchored directly below its own trigger button (like
 * `AccountMenu`/`ProjectSwitcher`) rather than centred on the viewport —
 * centring made sense for `DatePicker`/`TimePicker` (one clear "the" picker
 * per form), but with several of these open at once in a form grid,
 * centring them all in the same spot made whichever opened last cover the
 * others. Generic over the option value type so both string (recurrence)
 * and number (assignee id) selects can share it.
 */
export const SelectPopover = <T extends string | number>({
  label,
  value,
  options,
  onChange,
  disabled = false,
  placeholder = 'Select…',
  align = 'left',
}: SelectPopoverProps<T>) => {
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

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      <div className="mb-1">
        <label className="mb-1 block text-xsmall tracking-wider text-dark-secondary/80 uppercase">
          {label}
        </label>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((v) => !v)}
          className={`flex w-full items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-xsmall transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
            selected
              ? 'border-dark-border bg-dark-surface-2 text-dark-primary hover:border-dark-border-focus'
              : 'border-dark-border bg-dark-surface-2 text-dark-secondary/70 hover:border-dark-border-focus hover:text-dark-secondary'
          }`}
        >
          {selected?.dotColor && (
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-black/20"
              style={{ backgroundColor: selected.dotColor }}
            />
          )}
          <span className="flex-1 truncate">
            {selected?.label ?? placeholder}
          </span>
        </button>
      </div>

      {open && !disabled && (
        <div
          className={`absolute top-full z-50 mt-1.5 w-64 overflow-hidden rounded-2xl border border-dark-border bg-dark-surface-1 shadow-2xl ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          <div className="border-b border-dark-border px-4 py-3 text-small font-semibold text-dark-primary">
            {label}
          </div>
          <div className="scrollbar-app max-h-72 overflow-y-auto p-2">
            {options.map((option) => {
              const active = option.value === value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xsmall transition ${
                    active
                      ? 'bg-accent-blue font-semibold text-white'
                      : 'text-dark-secondary hover:bg-dark-surface-3 hover:text-dark-primary'
                  }`}
                >
                  {option.dotColor && (
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-black/20"
                      style={{ backgroundColor: option.dotColor }}
                    />
                  )}
                  <span className="min-w-0 flex-1 truncate">
                    {option.label}
                  </span>
                  {active && (
                    <CheckIcon className="h-3 w-3 shrink-0 text-white" />
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
