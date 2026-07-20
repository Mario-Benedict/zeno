import { useEffect, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import type { TranslationKey } from '@/i18n/dictionary';
import type { PomodoroSettings } from '@/types/reminder';
import MoreIcon from '@public/icons/large/more.svg';
import PlayIcon from '@public/icons/small/play.svg';
import RestartIcon from '@public/icons/small/restart.svg';
import StopIcon from '@public/icons/small/stop.svg';
import { PomodoroSettingsPopover } from './PomodoroSettingsPopover';

const DEFAULT_SETTINGS: PomodoroSettings = {
  focus_minutes: 25,
  break_minutes: 5,
};

const MODE_STYLES = {
  focus: {
    labelKey: 'reminders.focus' as TranslationKey,
    badgeClass: 'bg-accent-blue/15 text-accent-blue border-accent-blue/30',
    ringClass: 'ring-accent-blue/40',
    timeClass: 'text-dark-primary',
    startButtonClass: 'bg-accent-blue hover:bg-opacity-90',
  },
  break: {
    labelKey: 'reminders.break' as TranslationKey,
    badgeClass: 'bg-accent-green/15 text-accent-green border-accent-green/30',
    ringClass: 'ring-accent-green/40',
    timeClass: 'text-accent-green',
    startButtonClass: 'bg-accent-green hover:bg-opacity-90',
  },
} as const;

const formatHms = (totalSeconds: number): string => {
  const clamped = Math.max(0, totalSeconds);
  const h = Math.floor(clamped / 3600);
  const m = Math.floor((clamped % 3600) / 60);
  const s = clamped % 60;
  const pad = (n: number) => String(n).padStart(2, '0');

  return `${pad(h)}:${pad(m)}:${pad(s)}`;
};

interface PomodoroTimerProps {
  settings: PomodoroSettings | null;
  onSaveSettings: (settings: PomodoroSettings) => void;
}

export const PomodoroTimer = ({
  settings,
  onSaveSettings,
}: PomodoroTimerProps) => {
  const { t } = useTranslation();
  const activeSettings = settings ?? DEFAULT_SETTINGS;
  // `mode` and `secondsLeft` are tracked as a single state object and always
  // updated together via a functional updater. This is what lets the tick
  // that crosses zero read the *current* mode reliably (not a value closed
  // over when the interval was created) and flip to the other mode's full
  // duration in the same atomic update — no separate effect racing to catch
  // the mode change afterwards.
  const [timer, setTimer] = useState<{
    mode: 'focus' | 'break';
    secondsLeft: number;
  }>({ mode: 'focus', secondsLeft: activeSettings.focus_minutes * 60 });
  const [running, setRunning] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Reset the visible countdown whenever settings change and the timer isn't running.
  useEffect(() => {
    if (running) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTimer((t) => ({
      ...t,
      secondsLeft:
        (t.mode === 'focus'
          ? activeSettings.focus_minutes
          : activeSettings.break_minutes) * 60,
    }));
  }, [activeSettings.focus_minutes, activeSettings.break_minutes, running]);

  // Ticks once a second while running. Deliberately does NOT depend on
  // `mode` — the same interval keeps running straight through a focus/break
  // flip instead of being torn down and recreated on every transition.
  useEffect(() => {
    if (!running) return;

    const interval = setInterval(() => {
      setTimer((t) => {
        if (t.secondsLeft > 1) {
          return { ...t, secondsLeft: t.secondsLeft - 1 };
        }

        const nextMode = t.mode === 'focus' ? 'break' : 'focus';

        return {
          mode: nextMode,
          secondsLeft:
            (nextMode === 'focus'
              ? activeSettings.focus_minutes
              : activeSettings.break_minutes) * 60,
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [running, activeSettings.focus_minutes, activeSettings.break_minutes]);

  const { mode, secondsLeft } = timer;

  const handleReset = () => {
    setRunning(false);
    setTimer({ mode: 'focus', secondsLeft: activeSettings.focus_minutes * 60 });
  };

  const handleSaveSettings = (next: PomodoroSettings) => {
    onSaveSettings(next);
    setSettingsOpen(false);
  };

  const style = MODE_STYLES[mode];
  const modeLabel = t(style.labelKey);

  return (
    <div
      className={`relative rounded-2xl bg-dark-surface-2 p-5 ring-1 transition-colors ${style.ringClass}`}
    >
      <div className="mb-4 flex items-center justify-between">
        <span
          className={`rounded-full border px-3 py-1 text-xsmall font-semibold tracking-wider uppercase ${style.badgeClass}`}
        >
          {running ? t('reminders.running', { label: modeLabel }) : modeLabel}
        </span>
        <div className="relative">
          <button
            type="button"
            onClick={() => setSettingsOpen((v) => !v)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-dark-secondary transition hover:bg-white/[0.07] hover:text-dark-primary"
            aria-label={t('reminders.timerSettings')}
          >
            <MoreIcon className="h-4 w-4" />
          </button>

          {settingsOpen && (
            <PomodoroSettingsPopover
              settings={activeSettings}
              onSave={handleSaveSettings}
              onClose={() => setSettingsOpen(false)}
            />
          )}
        </div>
      </div>

      <p
        className={`mb-4 text-center font-mono text-h1 tracking-wider tabular-nums transition-colors ${style.timeClass}`}
      >
        {formatHms(secondsLeft)}
      </p>

      <div className="flex items-center justify-center gap-2">
        {!running ? (
          <button
            type="button"
            onClick={() => setRunning(true)}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-small font-semibold text-white transition ${style.startButtonClass}`}
          >
            <PlayIcon className="h-3.5 w-3.5" />
            {t('reminders.start')}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setRunning(false)}
            className="flex items-center gap-1.5 rounded-lg bg-dark-surface-3 px-4 py-2 text-small font-semibold text-dark-primary transition hover:bg-dark-secondary"
          >
            <StopIcon className="h-3.5 w-3.5" />
            {t('reminders.stop')}
          </button>
        )}
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1.5 rounded-lg bg-dark-surface-3 px-4 py-2 text-small font-semibold text-dark-primary transition hover:bg-dark-secondary"
        >
          <RestartIcon className="h-3.5 w-3.5" />
          {t('reminders.reset')}
        </button>
      </div>
    </div>
  );
};
