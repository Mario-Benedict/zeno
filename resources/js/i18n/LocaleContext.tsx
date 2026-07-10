import { router } from '@inertiajs/react';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Theme } from '@/lib/theme';
import { applyThemeClass, getStoredTheme, persistTheme } from '@/lib/theme';
import preferences from '@/routes/preferences';
import type { Locale } from './dictionary';
import type { AuthPageProps, CalendarVisibility } from './localeStorage';
import {
  getStoredLocale,
  persistLocale,
  readInitialPageProps,
} from './localeStorage';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  calendarVisibility: CalendarVisibility;
  setCalendarVisibility: (visibility: CalendarVisibility) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export const LocaleProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocaleState] = useState<Locale>(getStoredLocale);
  const [theme, setThemeState] = useState<Theme>(getStoredTheme);
  // No localStorage backing (unlike locale/theme) — this preference doesn't
  // affect pre-paint rendering, so it's fine to start at the DB default and
  // pick up the real value once `reconcile` sees the server's page props.
  const [calendarVisibility, setCalendarVisibilityState] =
    useState<CalendarVisibility>('busy_only');
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
  const pendingCalendarVisibilityRef = useRef<CalendarVisibility | null>(null);

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

      const serverCalendarVisibility = props?.auth?.user?.calendar_visibility;
      if (serverCalendarVisibility) {
        if (
          pendingCalendarVisibilityRef.current !== null &&
          serverCalendarVisibility !== pendingCalendarVisibilityRef.current
        ) {
          // Same guard as above, for calendar visibility.
        } else {
          if (
            pendingCalendarVisibilityRef.current === serverCalendarVisibility
          ) {
            pendingCalendarVisibilityRef.current = null;
          }
          setCalendarVisibilityState(serverCalendarVisibility);
        }
      }
    };

    reconcile(currentProps.current);

    return router.on('navigate', (event) =>
      reconcile(event.detail.page.props as AuthPageProps),
    );
  }, []);

  const persistPreference = (patch: {
    locale?: Locale;
    theme?: Theme;
    calendar_visibility?: CalendarVisibility;
  }) => {
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
        if ('calendar_visibility' in patch) {
          pendingCalendarVisibilityRef.current = null;
        }
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

  const setCalendarVisibility = (next: CalendarVisibility) => {
    pendingCalendarVisibilityRef.current = next;
    setCalendarVisibilityState(next);
    persistPreference({ calendar_visibility: next });
  };

  return (
    <LocaleContext.Provider
      value={{
        locale,
        setLocale,
        theme,
        setTheme,
        calendarVisibility,
        setCalendarVisibility,
      }}
    >
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
