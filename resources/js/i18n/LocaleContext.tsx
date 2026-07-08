import { router } from '@inertiajs/react';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import preferences from '@/routes/preferences';
import type { Locale } from './dictionary';

const STORAGE_KEY = 'locale';

/** Synchronous, localStorage-first read — mirrors PreferencesTab's getStoredTheme(). */
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
  auth?: { user?: { locale?: Locale; theme?: 'dark' | 'light' } | null };
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
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export const LocaleProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocaleState] = useState<Locale>(getStoredLocale);
  // Tracks the current page's props across client-side navigations, since
  // the DOM's `data-page` attribute only reflects the very first server
  // render and Inertia doesn't rewrite it on subsequent visits.
  const currentProps = useRef<AuthPageProps | null>(readInitialPageProps());

  // Reconcile locale and theme with the server's stored preference on every
  // Inertia navigation (e.g. preference changed on another device, or user
  // just logged in with a different account).
  useEffect(() => {
    const reconcile = (props: AuthPageProps | null) => {
      currentProps.current = props;
      const serverLocale = props?.auth?.user?.locale;
      if (serverLocale && serverLocale !== getStoredLocale()) {
        setLocaleState(serverLocale);
        persistLocale(serverLocale);
      }

      // Theme reconciliation — mirrors the locale logic above.
      const serverTheme = props?.auth?.user?.theme;
      if (serverTheme) {
        try {
          const storedTheme = localStorage.getItem('theme') as
            | 'dark'
            | 'light'
            | null;
          if (serverTheme !== storedTheme) {
            localStorage.setItem('theme', serverTheme);
            if (serverTheme === 'light') {
              document.documentElement.classList.add('light-mode');
            } else {
              document.documentElement.classList.remove('light-mode');
            }
          }
        } catch {
          /* localStorage unavailable — apply DOM class only */
          if (serverTheme === 'light') {
            document.documentElement.classList.add('light-mode');
          } else {
            document.documentElement.classList.remove('light-mode');
          }
        }
      }
    };

    reconcile(currentProps.current);

    return router.on('navigate', (event) =>
      reconcile(event.detail.page.props as AuthPageProps),
    );
  }, []);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    persistLocale(next);

    const props = currentProps.current;
    const accountIndex = props?.account?.index;
    if (props?.auth?.user && accountIndex !== undefined) {
      router.patch(
        preferences.update.url({ accountIndex }),
        { locale: next },
        { preserveScroll: true, preserveState: true },
      );
    }
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
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
