import { useEffect, useRef, useState } from 'react';
import ClockIcon from '@public/icons/small/time.svg';

interface TimePickerProps {
  /** 24-hour "HH:mm", or null when unset. */
  value: string | null;
  /** Emits an updated 24-hour "HH:mm". */
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  ariaLabel?: string;
}

type Period = 'AM' | 'PM';

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

const pad = (n: number) => String(n).padStart(2, '0');

const parse = (
  value: string | null,
): { hour12: number; minute: number; period: Period } => {
  if (!value) return { hour12: 12, minute: 0, period: 'AM' };
  const [h, m] = value.split(':').map(Number);
  const hour = isNaN(h) ? 0 : h;

  return {
    hour12: hour % 12 === 0 ? 12 : hour % 12,
    minute: isNaN(m) ? 0 : m,
    period: hour >= 12 ? 'PM' : 'AM',
  };
};

const to24 = (hour12: number, minute: number, period: Period): string => {
  const base = hour12 % 12;
  const hour = period === 'PM' ? base + 12 : base;

  return `${pad(hour)}:${pad(minute)}`;
};

interface TimeColumnProps {
  label: string;
  items: { value: number; label: string }[];
  selected: number | null;
  onSelect: (value: number) => void;
}

/** A single vertically-scrollable column of selectable time values. */
const TimeColumn = ({ label, items, selected, onSelect }: TimeColumnProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  // Centre the selected row within the column when it first mounts (on open).
  useEffect(() => {
    const container = containerRef.current;
    const item = selectedRef.current;
    if (!container || !item) return;
    const containerRect = container.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    container.scrollTop +=
      itemRect.top -
      containerRect.top -
      container.clientHeight / 2 +
      item.clientHeight / 2;
  }, []);

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <p className="mb-1 text-center text-micro font-semibold tracking-wider text-white/20 uppercase">
        {label}
      </p>
      <div
        ref={containerRef}
        className="scrollbar-app h-44 overflow-y-auto rounded-lg border border-dark-border bg-dark-surface-2 py-1"
      >
        {items.map((item) => {
          const active = item.value === selected;

          return (
            <button
              key={item.value}
              ref={active ? selectedRef : null}
              type="button"
              onClick={() => onSelect(item.value)}
              className={`w-full py-1.5 text-center text-xsmall transition ${
                active
                  ? 'bg-accent-blue font-semibold text-white'
                  : 'text-white/50 hover:bg-white/8 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/**
 * A time picker styled to match the `DatePicker`: the same trigger button and
 * centred dark popover, but with scrollable accent-blue columns for the hour
 * (1–12) and minute (00–59), plus an AM/PM toggle. Reads / emits 24-hour
 * "HH:mm".
 */
export const TimePicker = ({
  value,
  onChange,
  disabled = false,
  placeholder = 'Set time',
  ariaLabel,
}: TimePickerProps) => {
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

  const current = parse(value);

  const emit = (
    patch: Partial<{ hour12: number; minute: number; period: Period }>,
  ) => {
    onChange(
      to24(
        patch.hour12 ?? current.hour12,
        patch.minute ?? current.minute,
        patch.period ?? current.period,
      ),
    );
  };

  const setNow = () => {
    const now = new Date();
    onChange(`${pad(now.getHours())}:${pad(now.getMinutes())}`);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-xsmall transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
          value
            ? 'border-dark-border bg-dark-surface-2 text-white/70 hover:border-dark-border-focus'
            : 'border-dark-border bg-dark-surface-2 text-white/25 hover:border-dark-border-focus hover:text-white/40'
        }`}
      >
        <ClockIcon className="h-3.5 w-3.5 shrink-0 opacity-60" />
        <span className="flex-1 truncate">
          {value
            ? `${current.hour12}:${pad(current.minute)} ${current.period}`
            : placeholder}
        </span>
      </button>

      {open && !disabled && (
        <div className="fixed top-1/2 left-1/2 z-50 w-72 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-dark-border bg-dark-surface-1 shadow-2xl">
          <div className="border-b border-dark-border px-4 py-3 text-center text-small font-semibold text-white/80">
            {current.hour12}:{pad(current.minute)} {current.period}
          </div>

          <div className="flex gap-2 px-3 py-3">
            <TimeColumn
              label="Hour"
              items={HOURS.map((h) => ({ value: h, label: String(h) }))}
              selected={value ? current.hour12 : null}
              onSelect={(h) => emit({ hour12: h })}
            />
            <TimeColumn
              label="Min"
              items={MINUTES.map((m) => ({ value: m, label: pad(m) }))}
              selected={value ? current.minute : null}
              onSelect={(m) => emit({ minute: m })}
            />
            <div className="flex w-14 shrink-0 flex-col">
              <p className="mb-1 text-center text-micro font-semibold tracking-wider text-white/20 uppercase">
                &nbsp;
              </p>
              <div className="flex h-44 flex-col justify-center gap-2">
                {(['AM', 'PM'] as const).map((p) => {
                  const active = !!value && current.period === p;

                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => emit({ period: p })}
                      className={`rounded-lg py-2 text-xsmall font-semibold transition ${
                        active
                          ? 'bg-accent-blue text-white'
                          : 'border border-dark-border bg-dark-surface-2 text-white/40 hover:text-white/70'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex gap-2 px-3 pb-3">
            <button
              type="button"
              onClick={setNow}
              className="flex-1 rounded-lg border border-dark-border bg-dark-surface-2 py-1.5 text-xsmall text-white/40 transition hover:bg-dark-surface-3 hover:text-white/70"
            >
              Now
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="hover:bg-opacity-90 flex-1 rounded-lg bg-accent-blue py-1.5 text-xsmall font-semibold text-white transition"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
