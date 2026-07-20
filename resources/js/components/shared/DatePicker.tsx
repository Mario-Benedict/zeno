import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';

interface DatePickerProps {
  value: string | null;
  onChange: (value: string) => void;
  onClear?: () => void;
  label: string;
  placeholder?: string;
  highlightOverdue?: boolean;
}

export const DatePicker = ({
  value,
  onChange,
  onClear,
  label,
  placeholder,
  highlightOverdue = false,
}: DatePickerProps) => {
  const { locale, t } = useTranslation();
  const localeCode = locale === 'id' ? 'id-ID' : 'en-US';
  const dayLabels = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) =>
        new Intl.DateTimeFormat(localeCode, { weekday: 'short' }).format(
          new Date(2024, 0, 7 + i),
        ),
      ),
    [localeCode],
  );
  const monthLabels = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) =>
        new Intl.DateTimeFormat(localeCode, { month: 'long' }).format(
          new Date(2024, i, 1),
        ),
      ),
    [localeCode],
  );
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => {
    if (value) return new Date(value + 'T00:00:00').getFullYear();
    return new Date().getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    if (value) return new Date(value + 'T00:00:00').getMonth();
    return new Date().getMonth();
  });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      const d = new Date(value + 'T00:00:00');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [value]);

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

  const selectedDate = value ? new Date(value + 'T00:00:00') : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isOverdue = highlightOverdue && selectedDate && selectedDate < today;
  const isDueSoon =
    highlightOverdue &&
    selectedDate &&
    !isOverdue &&
    selectedDate.getTime() - today.getTime() < 86400000 * 2;

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const cells: { date: Date; isCurrentMonth: boolean }[] = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({
      date: new Date(viewYear, viewMonth - 1, daysInPrevMonth - i),
      isCurrentMonth: false,
    });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      date: new Date(viewYear, viewMonth, d),
      isCurrentMonth: true,
    });
  }
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({
      date: new Date(viewYear, viewMonth + 1, d),
      isCurrentMonth: false,
    });
  }

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  };

  const selectDate = (date: Date) => {
    const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    onChange(iso);
    setOpen(false);
  };

  const formatLocalizedDisplay = (d: Date) =>
    d.toLocaleDateString(localeCode, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  return (
    <div ref={ref} className="relative">
      <div className="mb-1">
        <label className="mb-1 block text-xsmall tracking-wider text-dark-secondary/80 uppercase">
          {label}
        </label>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`flex w-full items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-xsmall transition-all ${
            isOverdue
              ? 'border-accent-red/40 bg-accent-red/10 text-accent-red hover:border-accent-red/70'
              : isDueSoon
                ? 'border-accent-yellow/40 bg-accent-yellow/10 text-accent-yellow hover:border-accent-yellow/70'
                : selectedDate
                  ? 'border-dark-border bg-dark-surface-2 text-dark-primary hover:border-dark-border-focus'
                  : 'border-dark-border bg-dark-surface-2 text-dark-secondary/70 hover:border-dark-border-focus hover:text-dark-secondary'
          }`}
        >
          <span className="flex-1 truncate">
            {selectedDate
              ? formatLocalizedDisplay(selectedDate)
              : (placeholder ?? t('common.setDate'))}
          </span>
          {selectedDate && onClear && (
            <span
              role="button"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full text-xsmall text-dark-secondary/70 transition hover:bg-dark-surface-3 hover:text-dark-secondary"
            >
              ✕
            </span>
          )}
        </button>
      </div>

      {open && (
        <div className="fixed top-1/2 left-1/2 z-50 w-64 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-dark-border bg-dark-surface-1 shadow-2xl">
          <div className="flex items-center justify-between border-b border-dark-border px-4 py-3">
            <button
              type="button"
              onClick={prevMonth}
              className="flex h-6 w-6 items-center justify-center rounded-lg text-small text-dark-secondary/80 transition hover:bg-dark-surface-3 hover:text-dark-primary"
            >
              ‹
            </button>
            <button
              type="button"
              className="flex items-center gap-1.5 text-small font-semibold text-dark-primary transition hover:text-dark-primary"
              onClick={() => {
                setViewMonth(new Date().getMonth());
                setViewYear(new Date().getFullYear());
              }}
              title={t('common.jumpToToday')}
            >
              {monthLabels[viewMonth]} {viewYear}
            </button>
            <button
              type="button"
              onClick={nextMonth}
              className="flex h-6 w-6 items-center justify-center rounded-lg text-small text-dark-secondary/80 transition hover:bg-dark-surface-3 hover:text-dark-primary"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 px-3 pt-3 pb-1">
            {dayLabels.map((d) => (
              <div
                key={d}
                className="py-1 text-center text-xsmall font-semibold tracking-wider text-dark-secondary/70 uppercase"
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-0.5 px-3 pb-3">
            {cells.map(({ date, isCurrentMonth }, i) => {
              const isToday = date.getTime() === today.getTime();
              const isSelected =
                selectedDate &&
                date.getFullYear() === selectedDate.getFullYear() &&
                date.getMonth() === selectedDate.getMonth() &&
                date.getDate() === selectedDate.getDate();
              const isPast = isCurrentMonth && date < today;

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => selectDate(date)}
                  className={`relative flex aspect-square w-full items-center justify-center rounded-lg text-xsmall transition-all ${!isCurrentMonth ? 'text-dark-secondary/50 hover:text-dark-secondary/70' : ''} ${isCurrentMonth && !isSelected && !isToday ? 'text-dark-secondary hover:bg-dark-surface-3 hover:text-dark-primary' : ''} ${isPast && !isSelected ? 'text-dark-secondary/80' : ''} ${isToday && !isSelected ? 'font-semibold text-accent-blue' : ''} ${isSelected ? 'bg-accent-blue font-semibold text-white shadow-[0_0_12px] shadow-accent-blue/40' : ''} `}
                >
                  {isToday && !isSelected && (
                    <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-accent-blue" />
                  )}
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          <div className="flex gap-2 px-3 pb-3">
            <button
              type="button"
              onClick={() => selectDate(today)}
              className="flex-1 rounded-lg border border-dark-border bg-dark-surface-2 py-1.5 text-xsmall text-dark-secondary transition hover:bg-dark-surface-3 hover:text-dark-primary"
            >
              {t('common.today')}
            </button>
            {selectedDate && onClear && (
              <button
                type="button"
                onClick={() => {
                  onClear();
                  setOpen(false);
                }}
                className="flex-1 rounded-lg border border-dark-border bg-dark-surface-2 py-1.5 text-xsmall text-dark-secondary transition hover:border-accent-red/30 hover:bg-accent-red/10 hover:text-accent-red"
              >
                {t('common.clear')}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
