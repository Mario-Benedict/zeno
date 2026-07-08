export type Theme = 'dark' | 'light';

export const THEME_STORAGE_KEY = 'theme';

/** Synchronous, localStorage-first read — mirrors `getStoredLocale()`. */
export const getStoredTheme = (): Theme => {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === 'light'
      ? 'light'
      : 'dark';
  } catch {
    return 'dark';
  }
};

export const persistTheme = (theme: Theme) => {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // localStorage unavailable — the in-memory value still applies this session.
  }
};

/** Toggles the `light-mode` class that `html.light-mode` in app.css keys off. */
export const applyThemeClass = (theme: Theme) => {
  document.documentElement.classList.toggle('light-mode', theme === 'light');
};
