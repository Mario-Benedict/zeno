import { useState } from 'react';
import { FieldLabel } from './shared';

// ── Icons (stroke="currentColor" so they inherit the wrapper text color) ─

const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

// ── Theme helpers ─────────────────────────────────────────────────────────

const getStoredTheme = (): 'dark' | 'light' => {
  try {
    return (localStorage.getItem('theme') as 'dark' | 'light') ?? 'dark';
  } catch {
    return 'dark';
  }
};

const applyTheme = (theme: 'dark' | 'light') => {
  try {
    localStorage.setItem('theme', theme);
  } catch { /* ignore */ }
  if (theme === 'light') {
    document.documentElement.classList.add('light-mode');
  } else {
    document.documentElement.classList.remove('light-mode');
  }
};

// ── PreferencesTab ────────────────────────────────────────────────────────

const PreferencesTab = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>(getStoredTheme);

  const handleTheme = (next: 'dark' | 'light') => {
    setTheme(next);
    applyTheme(next);
  };

  return (
    <div>
      <h3 className="mb-5 text-normal font-semibold text-dark-primary">Preferences</h3>
      <div className="space-y-5">
        <div>
          <FieldLabel>Appearance</FieldLabel>
          <p className="mb-3 text-xsmall text-dark-secondary">Choose how Zeno looks on this device.</p>
          <div className="grid grid-cols-2 gap-3">
            {/* Dark option */}
            <button
              type="button"
              onClick={() => handleTheme('dark')}
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
              <div className={`flex items-center gap-2 ${theme === 'dark' ? 'text-accent-blue' : 'text-dark-primary'}`}>
                <MoonIcon />
                <span className="text-small font-semibold">Dark</span>
              </div>
            </button>

            {/* Light option */}
            <button
              type="button"
              onClick={() => handleTheme('light')}
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
              <div className={`flex items-center gap-2 ${theme === 'light' ? 'text-accent-blue' : 'text-dark-primary'}`}>
                <SunIcon />
                <span className="text-small font-semibold">Light</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreferencesTab;
