import { router } from '@inertiajs/react';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Theme } from '@/lib/theme';
import { applyThemeClass, getStoredTheme, persistTheme } from '@/lib/theme';
import preferences from '@/routes/preferences';
import type { Locale } from './dictionary';

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

const persistLocale = (locale: Locale) => {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // localStorage unavailable — the in-memory value still applies this session.
  }
};

interface AuthPageProps {
  auth?: { user?: { locale?: Locale; theme?: Theme } | null };
  account?: { index?: number };
}

/**
 * Reads the server-rendered initial page payload straight out of the DOM
 * (Inertia embeds it as JSON on `#app[data-page]`), without depending on
 * `usePage()` — `LocaleProvider` sits outside Inertia's `<App>` component
 * (it wraps `<App>` in app.tsx so every page, including auth pages that
 * don't use AppLayout, gets it), so React's page context isn't available here.
 */
const readInitialPageProps = (): AuthPageProps | null => {
  try {
    const raw = document.getElementById('app')?.dataset.page;

    return raw ? (JSON.parse(raw).props as AuthPageProps) : null;
  } catch {
    return null;
  }
};

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export const LocaleProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocaleState] = useState<Locale>(getStoredLocale);
  const [theme, setThemeState] = useState<Theme>(getStoredTheme);
  // Tracks the current page's props across client-side navigations, since
  // the DOM's `data-page` attribute only reflects the very first server
  // render and Inertia doesn't rewrite it on subsequent visits.
  const currentProps = useRef<AuthPageProps | null>(readInitialPageProps());

  // Guards against the reconciliation race below: while a locale/theme PATCH
  // we just fired is still in flight, an unrelated navigation can land with
  // page props captured *before* that PATCH was processed server-side, still
  // carrying the old value. Without this guard, `reconcile` would see that
  // stale server value differs from what the user just picked and silently
  // revert it — a "toggle Light, click a nav link, it flips back to Dark"
  // bug. The ref holds the value we're waiting to see confirmed; reconcile
  // ignores server values that don't match it, and clears it once they do
  // (or once the request itself fails, since then no confirming navigation
  // will ever arrive).
  const pendingLocaleRef = useRef<Locale | null>(null);
  const pendingThemeRef = useRef<Theme | null>(null);

  // Reconcile locale and theme with the server's stored preference on every
  // Inertia navigation (e.g. preference changed on another device, or user
  // just logged in with a different account).
  useEffect(() => {
    const reconcile = (props: AuthPageProps | null) => {
      currentProps.current = props;

      const serverLocale = props?.auth?.user?.locale;
      if (serverLocale) {
        if (
          pendingLocaleRef.current !== null &&
          serverLocale !== pendingLocaleRef.current
        ) {
          // Still waiting for our own pending write to be reflected — don't
          // let this (possibly stale) server value override it.
        } else {
          if (pendingLocaleRef.current === serverLocale) {
            pendingLocaleRef.current = null;
          }
          if (serverLocale !== getStoredLocale()) {
            setLocaleState(serverLocale);
            persistLocale(serverLocale);
          }
        }
      }

      const serverTheme = props?.auth?.user?.theme;
      if (serverTheme) {
        if (
          pendingThemeRef.current !== null &&
          serverTheme !== pendingThemeRef.current
        ) {
          // Same guard as above, for theme.
        } else {
          if (pendingThemeRef.current === serverTheme) {
            pendingThemeRef.current = null;
          }
          if (serverTheme !== getStoredTheme()) {
            setThemeState(serverTheme);
            persistTheme(serverTheme);
            applyThemeClass(serverTheme);
          }
        }
      }
    };

    reconcile(currentProps.current);

    return router.on('navigate', (event) =>
      reconcile(event.detail.page.props as AuthPageProps),
    );
  }, []);

  const persistPreference = (patch: { locale?: Locale; theme?: Theme }) => {
    const props = currentProps.current;
    const accountIndex = props?.account?.index;
    if (!props?.auth?.user || accountIndex === undefined) return;

    router.patch(preferences.update.url({ accountIndex }), patch, {
      preserveScroll: true,
      preserveState: true,
      onError: () => {
        // The write failed server-side — nothing will ever arrive to confirm
        // it, so stop waiting and let normal reconciliation resume.
        if ('locale' in patch) pendingLocaleRef.current = null;
        if ('theme' in patch) pendingThemeRef.current = null;
      },
    });
  };

  const setLocale = (next: Locale) => {
    pendingLocaleRef.current = next;
    setLocaleState(next);
    persistLocale(next);
    persistPreference({ locale: next });
  };

  const setTheme = (next: Theme) => {
    pendingThemeRef.current = next;
    setThemeState(next);
    persistTheme(next);
    applyThemeClass(next);
    persistPreference({ theme: next });
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale, theme, setTheme }}>
      {children}
    </LocaleContext.Provider>
  );
};

export const useLocaleContext = (): LocaleContextValue => {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error('useLocaleContext must be used within a LocaleProvider');
  }
  return ctx;
};
