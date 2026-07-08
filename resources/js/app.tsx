import { createInertiaApp } from '@inertiajs/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { LocaleProvider } from '@/i18n/LocaleContext';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Apply persisted colour-scheme + language preference before first paint.
// LocaleProvider reads the same localStorage key synchronously on mount, so
// this block only needs to handle the CSS class swap for theme.
try {
  // Prefer the server's stored preference (from Inertia's initial page data)
  // so that the correct theme is applied immediately after login even if
  // localStorage is stale or absent on a new device.
  const initialPage = document.getElementById('app')?.dataset.page;
  const serverTheme = initialPage
    ? (JSON.parse(initialPage).props?.auth?.user?.theme as
        | 'dark'
        | 'light'
        | undefined)
    : undefined;

  const stored = localStorage.getItem('theme') as 'dark' | 'light' | null;
  // Server preference wins; fall back to localStorage; default is dark.
  const theme = serverTheme ?? stored ?? 'dark';

  // Keep localStorage in sync with the server value.
  localStorage.setItem('theme', theme);

  if (theme === 'light') {
    document.documentElement.classList.add('light-mode');
  } else {
    document.documentElement.classList.remove('light-mode');
  }
} catch {
  // localStorage / JSON unavailable — stay in default dark mode
}

const pages = import.meta.glob('./pages/**/*.tsx');

createInertiaApp({
  title: (title) => (title ? `${title} - ${appName}` : appName),

  resolve: async (name) =>
    ((await pages[`./pages/${name}.tsx`]()) as any).default,
  setup({ el, App, props }) {
    createRoot(el).render(
      <StrictMode>
        <LocaleProvider>
          <App {...props} />
        </LocaleProvider>
      </StrictMode>,
    );
  },
  progress: {
    color: '#4B5563',
  },
});
