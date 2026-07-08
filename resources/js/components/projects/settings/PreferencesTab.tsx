import { useTranslation } from '@/hooks/useTranslation';
import { useLocaleContext } from '@/i18n/LocaleContext';
import GlobeIcon from '@public/icons/small/globe.svg';
import { FieldLabel } from './shared';

// ── Icons (stroke="currentColor" so they inherit the wrapper text color) ─

const MoonIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const SunIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const EyeIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const MaskIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17 3.34a10 10 0 1 1-14.995 8.984" />
    <path d="M9 9a3 3 0 1 0 6 0 3 3 0 0 0-6 0z" />
    <path d="M14 3.223a10 10 0 0 1 5.777 5.777" />
  </svg>
);

const CircleIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="9" fill="currentColor" fillOpacity="0.25" />
  </svg>
);

// ── PreferencesTab ────────────────────────────────────────────────────────
//
// Theme + locale + calendar visibility are all owned by `LocaleContext` (a
// single source of truth shared with `app.tsx`'s pre-mount bootstrap), so
// this component just reads and writes through it rather than keeping its
// own copy of the state.

const PreferencesTab = () => {
  const { t } = useTranslation();
  const {
    locale,
    setLocale,
    theme,
    setTheme,
    calendarVisibility,
    setCalendarVisibility,
  } = useLocaleContext();

  return (
    <div>
      <h3 className="mb-5 text-normal font-semibold text-dark-primary">
        {t('projectSettings.preferencesTitle')}
      </h3>
      <div className="space-y-5">
        <div>
          <FieldLabel>{t('projectSettings.appearance')}</FieldLabel>
          <p className="mb-3 text-xsmall text-dark-secondary">
            {t('projectSettings.appearanceHint')}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {/* Dark option */}
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`flex flex-col items-center gap-3 rounded-xl border-2 p-4 transition-colors ${
                theme === 'dark'
                  ? 'border-accent-blue bg-accent-blue/10'
                  : 'border-dark-border bg-dark-surface-1 hover:border-dark-border-focus'
              }`}
            >
              <div className="w-full rounded-lg border border-dark-border bg-dark-surface-2 p-2">
                <div className="mb-2 h-2 w-3/4 rounded bg-dark-surface-3" />
                <div className="mb-1 h-2 w-full rounded bg-dark-surface-3/60" />
                <div className="h-2 w-2/3 rounded bg-dark-surface-3/40" />
              </div>
              {/* Icon inherits text color from wrapper div */}
              <div
                className={`flex items-center gap-2 ${theme === 'dark' ? 'text-accent-blue' : 'text-dark-primary'}`}
              >
                <MoonIcon />
                <span className="text-small font-semibold">
                  {t('projectSettings.dark')}
                </span>
              </div>
            </button>

            {/* Light option */}
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`flex flex-col items-center gap-3 rounded-xl border-2 p-4 transition-colors ${
                theme === 'light'
                  ? 'border-accent-blue bg-accent-blue/10'
                  : 'border-dark-border bg-dark-surface-1 hover:border-dark-border-focus'
              }`}
            >
              <div className="w-full rounded-lg border border-light-surface-3 bg-light-surface-2 p-2">
                <div className="mb-2 h-2 w-3/4 rounded bg-light-surface-3" />
                <div className="mb-1 h-2 w-full rounded bg-light-surface-3/70" />
                <div className="h-2 w-2/3 rounded bg-light-surface-3/50" />
              </div>
              <div
                className={`flex items-center gap-2 ${theme === 'light' ? 'text-accent-blue' : 'text-dark-primary'}`}
              >
                <SunIcon />
                <span className="text-small font-semibold">
                  {t('projectSettings.light')}
                </span>
              </div>
            </button>
          </div>
        </div>

        <div>
          <FieldLabel>{t('projectSettings.language')}</FieldLabel>
          <p className="mb-3 text-xsmall text-dark-secondary">
            {t('projectSettings.languageHint')}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {/* English option */}
            <button
              type="button"
              onClick={() => setLocale('en')}
              className={`flex flex-col items-center gap-3 rounded-xl border-2 p-4 transition-colors ${
                locale === 'en'
                  ? 'border-accent-blue bg-accent-blue/10'
                  : 'border-dark-border bg-dark-surface-1 hover:border-dark-border-focus'
              }`}
            >
              <div
                className={`flex items-center gap-2 ${locale === 'en' ? 'text-accent-blue' : 'text-dark-primary'}`}
              >
                <GlobeIcon />
                <span className="text-small font-semibold">
                  {t('projectSettings.english')}
                </span>
              </div>
            </button>

            {/* Indonesian option */}
            <button
              type="button"
              onClick={() => setLocale('id')}
              className={`flex flex-col items-center gap-3 rounded-xl border-2 p-4 transition-colors ${
                locale === 'id'
                  ? 'border-accent-blue bg-accent-blue/10'
                  : 'border-dark-border bg-dark-surface-1 hover:border-dark-border-focus'
              }`}
            >
              <div
                className={`flex items-center gap-2 ${locale === 'id' ? 'text-accent-blue' : 'text-dark-primary'}`}
              >
                <GlobeIcon />
                <span className="text-small font-semibold">
                  {t('projectSettings.indonesian')}
                </span>
              </div>
            </button>
          </div>
        </div>

        <div>
          <FieldLabel>{t('projectSettings.calendarVisibility')}</FieldLabel>
          <p className="mb-3 text-xsmall text-dark-secondary">
            {t('projectSettings.calendarVisibilityHint')}
          </p>
          <div className="grid grid-cols-3 gap-3">
            {(
              [
                {
                  value: 'transparent',
                  icon: <EyeIcon />,
                  labelKey: 'projectSettings.visibilityTransparent',
                  descKey: 'projectSettings.visibilityTransparentDescription',
                },
                {
                  value: 'masked',
                  icon: <MaskIcon />,
                  labelKey: 'projectSettings.visibilityMasked',
                  descKey: 'projectSettings.visibilityMaskedDescription',
                },
                {
                  value: 'busy_only',
                  icon: <CircleIcon />,
                  labelKey: 'projectSettings.visibilityBusyOnly',
                  descKey: 'projectSettings.visibilityBusyOnlyDescription',
                },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setCalendarVisibility(option.value)}
                className={`flex flex-col items-center gap-2 rounded-xl border-2 p-3 text-center transition-colors ${
                  calendarVisibility === option.value
                    ? 'border-accent-blue bg-accent-blue/10'
                    : 'border-dark-border bg-dark-surface-1 hover:border-dark-border-focus'
                }`}
              >
                <div
                  className={
                    calendarVisibility === option.value
                      ? 'text-accent-blue'
                      : 'text-dark-primary'
                  }
                >
                  {option.icon}
                </div>
                <span className="text-xsmall font-semibold text-dark-primary">
                  {t(option.labelKey)}
                </span>
                <span className="text-micro text-dark-secondary">
                  {t(option.descKey)}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreferencesTab;
