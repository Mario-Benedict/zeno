import { dictionaries } from '@/i18n/dictionary';
import type { TranslationKey } from '@/i18n/dictionary';
import { useLocaleContext } from '@/i18n/LocaleContext';

const resolve = (obj: unknown, path: string[]): string | undefined => {
  let current: unknown = obj;
  for (const segment of path) {
    if (typeof current !== 'object' || current === null) return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return typeof current === 'string' ? current : undefined;
};

const interpolate = (
  template: string,
  params?: Record<string, string | number>,
): string => {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) =>
    key in params ? String(params[key]) : match,
  );
};

/**
 * `const { t, locale, setLocale } = useTranslation()`.
 *
 * `t('namespace.key')` looks up the dot-path in the active locale's
 * dictionary and falls back to the English string if the active locale is
 * missing the key (never renders blank). Supports `{{var}}` interpolation
 * for the handful of dynamic strings that need it.
 */
export const useTranslation = () => {
  const { locale, setLocale } = useLocaleContext();

  const t = (key: TranslationKey, params?: Record<string, string | number>) => {
    const path = key.split('.');
    const value =
      resolve(dictionaries[locale], path) ?? resolve(dictionaries.en, path);

    return interpolate(value ?? key, params);
  };

  return { t, locale, setLocale };
};
