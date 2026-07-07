import { useEffect, useRef, useState } from 'react';
import ClockIcon from '@public/icons/small/time.svg';

interface TimePickerProps {
  /** 24-hour `HH:MM`, or empty string when nothing is set yet. */
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  disabled?: boolean;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) =>
  String(i).padStart(2, '0'),
);

export const TimePicker = ({
  value,
  onChange,
  label,
  placeholder = 'Set time',
  disabled = false,
}: TimePickerProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const hourListRef = useRef<HTMLDivElement>(null);
  const minuteListRef = useRef<HTMLDivElement>(null);

  const [hour, minute] = value ? value.split(':') : ['', ''];
  const displayHour = hour || '00';
  const displayMinute = minute || '00';

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

  useEffect(() => {
    if (!open) return;
    hourListRef.current
      ?.querySelector(`[data-value="${displayHour}"]`)
      ?.scrollIntoView({ block: 'center' });
    minuteListRef.current
      ?.querySelector(`[data-value="${displayMinute}"]`)
      ?.scrollIntoView({ block: 'center' });
    // Only scroll into position when the panel opens, not on every selection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const selectHour = (h: string) => onChange(`${h}:${displayMinute}`);
  const selectMinute = (m: string) => onChange(`${displayHour}:${m}`);

  const selectNow = () => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    onChange(`${pad(now.getHours())}:${pad(now.getMinutes())}`);
  };

  return (
    <div ref={ref} className="relative">
      <div className="mb-1">
        <label className="mb-1 block text-xsmall tracking-wider text-white/30 uppercase">
          {label}
        </label>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((v) => !v)}
          className={`flex w-full items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-xsmall transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
            value
              ? 'border-dark-border bg-dark-surface-2 text-white/70 hover:border-dark-border-focus'
              : 'border-dark-border bg-dark-surface-2 text-white/25 hover:border-dark-border-focus hover:text-white/40'
          }`}
        >
          <ClockIcon className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1 truncate">{value || placeholder}</span>
        </button>
      </div>

      {open && (
        <div className="fixed top-1/2 left-1/2 z-50 w-56 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-dark-border bg-dark-surface-1 shadow-2xl">
          <div className="flex items-center justify-between border-b border-dark-border px-4 py-3">
            <span className="text-small font-semibold text-white/70">
              {displayHour}:{displayMinute}
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-6 w-6 items-center justify-center rounded-lg text-small text-white/30 transition hover:bg-white/10 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="flex divide-x divide-dark-border">
            <div
              ref={hourListRef}
              className="scrollbar-app h-48 flex-1 overflow-y-auto py-1"
            >
              {HOURS.map((h) => (
                <button
                  key={h}
                  type="button"
                  data-value={h}
                  onClick={() => selectHour(h)}
                  className={`block w-full py-1.5 text-center text-small transition-all ${
                    h === displayHour
                      ? 'bg-accent-blue font-semibold text-white'
                      : 'text-white/50 hover:bg-white/5'
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
            <div
              ref={minuteListRef}
              className="scrollbar-app h-48 flex-1 overflow-y-auto py-1"
            >
              {MINUTES.map((m) => (
                <button
                  key={m}
                  type="button"
                  data-value={m}
                  onClick={() => selectMinute(m)}
                  className={`block w-full py-1.5 text-center text-small transition-all ${
                    m === displayMinute
                      ? 'bg-accent-blue font-semibold text-white'
                      : 'text-white/50 hover:bg-white/5'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 px-3 py-3">
            <button
              type="button"
              onClick={selectNow}
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
