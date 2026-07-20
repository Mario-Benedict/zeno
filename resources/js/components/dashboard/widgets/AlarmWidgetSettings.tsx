import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import type { PomodoroSettings } from '@/types/reminder';

interface Props {
  settings: PomodoroSettings;
  onSave: (settings: PomodoroSettings) => void;
  onClose: () => void;
}

export const AlarmWidgetSettings = ({ settings, onSave, onClose }: Props) => {
  const { t } = useTranslation();
  const [focusMinutes, setFocusMinutes] = useState(settings.focus_minutes);
  const [breakMinutes, setBreakMinutes] = useState(settings.break_minutes);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const handleSave = () => {
    onSave({
      focus_minutes: Math.min(180, Math.max(1, focusMinutes)),
      break_minutes: Math.min(60, Math.max(1, breakMinutes)),
    });
  };

  return (
    <div
      ref={ref}
      className="absolute top-full right-0 z-50 mt-2 w-52 rounded-xl border border-dark-border bg-dark-surface-1 p-3 shadow-2xl"
    >
      <p className="mb-2 text-micro font-semibold tracking-wider text-dark-secondary uppercase">
        {t('reminders.timerSettings')}
      </p>
      <div className="space-y-2">
        <div>
          <label className="mb-1 block text-micro text-dark-secondary">
            {t('reminders.focusMinutesLabel')}
          </label>
          <input
            type="number"
            min={1}
            max={180}
            value={focusMinutes}
            onChange={(e) => setFocusMinutes(Number(e.target.value))}
            className="w-full [appearance:textfield] rounded-lg border border-dark-border bg-dark-surface-2 px-2.5 py-1.5 text-xsmall text-dark-primary outline-none focus:border-dark-border-focus [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-micro text-dark-secondary">
            {t('reminders.breakMinutesLabel')}
          </label>
          <input
            type="number"
            min={1}
            max={60}
            value={breakMinutes}
            onChange={(e) => setBreakMinutes(Number(e.target.value))}
            className="w-full [appearance:textfield] rounded-lg border border-dark-border bg-dark-surface-2 px-2.5 py-1.5 text-xsmall text-dark-primary outline-none focus:border-dark-border-focus [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
        </div>
        <button
          type="button"
          onClick={handleSave}
          className="hover:bg-opacity-90 w-full rounded-lg bg-accent-blue px-3 py-1.5 text-xsmall font-semibold text-white transition"
        >
          {t('reminders.save')}
        </button>
      </div>
    </div>
  );
};
