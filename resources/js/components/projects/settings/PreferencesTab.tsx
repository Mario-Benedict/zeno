import { useTranslation } from '@/hooks/useTranslation';
import { useLocaleContext } from '@/i18n/LocaleContext';
import BlockIcon from '@public/icons/small/block.svg';
import EyeIcon from '@public/icons/small/eye.svg';
import EyeOffIcon from '@public/icons/small/eye_off.svg';
import GlobeIcon from '@public/icons/small/globe.svg';
import MoonIcon from '@public/icons/small/moon.svg';
import SunIcon from '@public/icons/small/sun.svg';
import FieldLabel from './FieldLabel';

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
              <div className="w-full rounded-lg border border-static-dark-surface-3 bg-static-dark-surface-2 p-2">
                <div className="mb-2 h-2 w-3/4 rounded bg-static-dark-surface-3" />
                <div className="mb-1 h-2 w-full rounded bg-static-dark-surface-3/60" />
                <div className="h-2 w-2/3 rounded bg-static-dark-surface-3/40" />
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
                  icon: <EyeIcon className="h-4 w-4" />,
                  labelKey: 'projectSettings.visibilityTransparent',
                  descKey: 'projectSettings.visibilityTransparentDescription',
                },
                {
                  value: 'masked',
                  icon: <EyeOffIcon className="h-4 w-4" />,
                  labelKey: 'projectSettings.visibilityMasked',
                  descKey: 'projectSettings.visibilityMaskedDescription',
                },
                {
                  value: 'busy_only',
                  icon: <BlockIcon className="h-4 w-4" />,
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
