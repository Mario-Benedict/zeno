import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { useProject } from '@/hooks/useProject';
import { useTranslation } from '@/hooks/useTranslation';
import type { TranslationKey } from '@/i18n/dictionary';
import pomodoro from '@/routes/pomodoro';
import type { PomodoroSettings } from '@/types/reminder';
import MoreIcon from '@public/icons/large/more.svg';
import PlayIcon from '@public/icons/small/play.svg';
import RestartIcon from '@public/icons/small/restart.svg';
import StopIcon from '@public/icons/small/stop.svg';
import { AlarmWidgetSettings } from './AlarmWidgetSettings';

interface Props {
  settings: PomodoroSettings | null;
}

const DEFAULT_SETTINGS: PomodoroSettings = {
  focus_minutes: 25,
  break_minutes: 5,
};

const MODE_STYLES = {
  focus: {
    labelKey: 'reminders.focus' as TranslationKey,
    badgeClass: 'bg-accent-blue/15 text-accent-blue border-accent-blue/30',
    timeClass: 'text-dark-primary',
    startButtonClass: 'bg-accent-blue hover:bg-opacity-90',
  },
  break: {
    labelKey: 'reminders.break' as TranslationKey,
    badgeClass: 'bg-accent-green/15 text-accent-green border-accent-green/30',
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

/**
 * Focus/break countdown widget for a dashboard slot — wraps the same
 * per-account timer settings the Reminders page's Pomodoro timer uses (same
 * `pomodoro.settings.update` endpoint, same focus/break minutes), just
 * labeled "Alarm" here and rebuilt as its own compact component rather than
 * importing `components/reminders/PomodoroTimer`.
 *
 * The header stays a fixed size to match the other widgets, but the
 * countdown digits scale with the slot itself via a CSS container query
 * (`@container` on the root + `@xs:`/`@sm:`/… variants on the digits) —
 * still only ever semantic font-size tokens, just a different one is
 * selected as the slot gets wider, so a small slot shows small digits and a
 * large slot shows large ones without any fixed/arbitrary pixel value.
 */
export const AlarmWidget = ({ settings }: Props) => {
  const { accountIndex } = useProject();
  const { t } = useTranslation();
  const activeSettings = settings ?? DEFAULT_SETTINGS;

  const [timer, setTimer] = useState<{
    mode: 'focus' | 'break';
    secondsLeft: number;
  }>({ mode: 'focus', secondsLeft: activeSettings.focus_minutes * 60 });
  const [running, setRunning] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

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
    router.patch(
      pomodoro.settings.update.url({ accountIndex }),
      {
        focus_minutes: next.focus_minutes,
        break_minutes: next.break_minutes,
      },
      {
        preserveScroll: true,
        preserveState: true,
        onError: () => console.error('Failed to save alarm settings'),
      },
    );
    setSettingsOpen(false);
  };

  const style = MODE_STYLES[mode];
  const modeLabel = t(style.labelKey);

  return (
    <div className="@container flex h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl bg-dark-surface-2">
      <div className="flex shrink-0 items-center justify-between pt-3 pr-10 pb-2 pl-3">
        <span className="text-small font-semibold text-dark-primary">
          {t('dashboard.widgetAlarmName')}
        </span>
        <div className="relative">
          <button
            type="button"
            onClick={() => setSettingsOpen((v) => !v)}
            aria-label={t('reminders.timerSettings')}
            className="rounded p-1 text-dark-secondary transition hover:bg-dark-surface-3 hover:text-dark-primary"
          >
            <MoreIcon className="h-4 w-4" />
          </button>

          {settingsOpen && (
            <AlarmWidgetSettings
              settings={activeSettings}
              onSave={handleSaveSettings}
              onClose={() => setSettingsOpen(false)}
            />
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-4 pb-4">
        <span
          className={`rounded-full border px-3 py-1 text-xsmall font-semibold tracking-wider uppercase ${style.badgeClass}`}
        >
          {running ? t('reminders.running', { label: modeLabel }) : modeLabel}
        </span>

        <p
          className={`text-center font-mono text-display-1 tracking-wider tabular-nums transition-colors @xs:text-display-2 @sm:text-display-3 @md:text-display-4 @lg:text-display-5 @xl:text-display-6 @2xl:text-display-7 @3xl:text-display-8 @4xl:text-display-9 ${style.timeClass}`}
        >
          {formatHms(secondsLeft)}
        </p>

        <div className="flex items-center justify-center gap-2">
          {!running ? (
            <button
              type="button"
              onClick={() => setRunning(true)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xsmall font-semibold text-white transition ${style.startButtonClass}`}
            >
              <PlayIcon className="h-3 w-3" />
              {t('reminders.start')}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setRunning(false)}
              className="flex items-center gap-1.5 rounded-lg bg-dark-surface-3 px-3 py-1.5 text-xsmall font-semibold text-dark-primary transition hover:bg-dark-secondary"
            >
              <StopIcon className="h-3 w-3" />
              {t('reminders.stop')}
            </button>
          )}
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 rounded-lg bg-dark-surface-3 px-3 py-1.5 text-xsmall font-semibold text-dark-primary transition hover:bg-dark-secondary"
          >
            <RestartIcon className="h-3 w-3" />
            {t('reminders.reset')}
          </button>
        </div>
      </div>
    </div>
  );
};
