import { createInertiaApp, router } from '@inertiajs/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import DeviceGate from '@/components/shared/DeviceGate';
import UploadErrorToast from '@/components/shared/UploadErrorToast';
import { LocaleProvider } from '@/i18n/LocaleContext';
import { applyThemeClass, getStoredTheme, persistTheme } from '@/lib/theme';
import type { Theme } from '@/lib/theme';
import { notifyUploadTooLarge } from '@/lib/uploadEvents';

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
    ? (JSON.parse(initialPage).props?.auth?.user?.theme as Theme | undefined)
    : undefined;

  // Server preference wins; fall back to localStorage; default is dark.
  const theme = serverTheme ?? getStoredTheme();

  // Keep localStorage in sync with the server value.
  persistTheme(theme);
  applyThemeClass(theme);
} catch {
  // localStorage / JSON unavailable — stay in default dark mode
}

const pages = import.meta.glob('./pages/**/*.tsx');

router.on('httpException', (event) => {
  if (event.detail.response.status !== 413) return;

  event.preventDefault();
  notifyUploadTooLarge();
});

createInertiaApp({
  title: (title) => (title ? `${title} - ${appName}` : appName),

  resolve: async (name) =>
    ((await pages[`./pages/${name}.tsx`]()) as any).default,
  setup({ el, App, props }) {
    createRoot(el).render(
      <StrictMode>
        <LocaleProvider>
          <DeviceGate>
            <App {...props} />
            <UploadErrorToast />
          </DeviceGate>
        </LocaleProvider>
      </StrictMode>,
    );
  },
  progress: {
    color: '#4B5563',
  },
});
