import type { Theme } from '@/lib/theme';
import type { Locale } from './dictionary';

// Split out from LocaleContext.tsx: that file must export only the
// `LocaleProvider` component (plus the `useLocaleContext` hook) so Vite's
// Fast Refresh can treat it as a clean component boundary — mixing in plain
// exports like `getStoredLocale` broke Fast Refresh for the whole module
// ("Could not Fast Refresh" / full-page-reload-on-every-edit), the same
// reason `lib/theme.ts` already lives separately from where it's consumed.

export type CalendarVisibility = 'transparent' | 'masked' | 'busy_only';

const STORAGE_KEY = 'locale';

/** Synchronous, localStorage-first read — mirrors `getStoredTheme()`. */
export const getStoredLocale = (): Locale => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    return stored === 'id' ? 'id' : 'en';
  } catch {
    return 'en';
  }
};

export const persistLocale = (locale: Locale) => {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // localStorage unavailable — the in-memory value still applies this session.
  }
};

export interface AuthPageProps {
  auth?: {
    user?: {
      locale?: Locale;
      theme?: Theme;
      calendar_visibility?: CalendarVisibility;
    } | null;
  };
  account?: { index?: number };
}

/**
 * Reads the server-rendered initial page payload straight out of the DOM
 * (Inertia embeds it as JSON on `#app[data-page]`), without depending on
 * `usePage()` — `LocaleProvider` sits outside Inertia's `<App>` component
 * (it wraps `<App>` in app.tsx so every page, including auth pages that
 * don't use AppLayout, gets it), so React's page context isn't available here.
 */
export const readInitialPageProps = (): AuthPageProps | null => {
  try {
    const raw = document.getElementById('app')?.dataset.page;

    return raw ? (JSON.parse(raw).props as AuthPageProps) : null;
  } catch {
    return null;
  }
};
