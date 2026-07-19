import defaultTheme from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
    './storage/framework/views/*.php',
    './resources/views/**/*.blade.php',
    './resources/js/**/*.tsx',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Figtree', ...defaultTheme.fontFamily.sans],
      },
      fontSize: {
        // Format: 'name': ['font-size', 'line-height']
        large: ['20px', '28px'],
        medium: ['18px', '25.2px'],
        normal: ['16px', '22.4px'],
        small: ['14px', '19.6px'],
        xsmall: ['12px', '16.8px'],
        micro: ['10px', '14px'],

        // Dedicated scale for large, purely-numeric displays (e.g. the Alarm
        // widget's countdown) that need to grow well past the h1-h6 heading
        // scale below without inflating those shared tokens site-wide.
        // display-1 through display-9 is exactly double the widget's
        // original 9-step h6->h1->(sm/md/lg) progression.
        'display-9': ['256px', { lineHeight: '281.6px', fontWeight: '700' }],
        'display-8': ['192px', { lineHeight: '211.2px', fontWeight: '700' }],
        'display-7': ['144px', { lineHeight: '158.4px', fontWeight: '700' }],
        'display-6': ['112px', { lineHeight: '123.2px', fontWeight: '700' }],
        'display-5': ['96px', { lineHeight: '105.6px', fontWeight: '700' }],
        'display-4': ['80px', { lineHeight: '88px', fontWeight: '700' }],
        'display-3': ['64px', { lineHeight: '70.4px', fontWeight: '700' }],
        'display-2': ['48px', { lineHeight: '52.8px', fontWeight: '700' }],
        'display-1': ['40px', { lineHeight: '44px', fontWeight: '700' }],
        h1: ['56px', { lineHeight: '61.6px', fontWeight: '700' }],
        h2: ['48px', { lineHeight: '52.8px', fontWeight: '700' }],
        h3: ['40px', { lineHeight: '44px', fontWeight: '700' }],
        h4: ['32px', { lineHeight: '35.2px', fontWeight: '700' }],
        h5: ['24px', { lineHeight: '26.4px', fontWeight: '700' }],
        h6: ['20px', { lineHeight: '22px', fontWeight: '600' }],
      },
      colors: {
        // --- DARK MODE ---
        // NOTE: the `dark.*` palette is intentionally NOT declared here.
        // It's declared as native CSS custom properties in the `@theme`
        // block in resources/css/app.css, so utility classes emit
        // `var(--color-dark-*)` instead of a literal hex value — that's
        // what lets `html.light-mode`'s variable overrides in app.css
        // actually recolor the UI. Adding a `dark` key back here would
        // make Tailwind's `@config` compat layer bake literal hex again
        // and silently break light mode. See the comment above that
        // `@theme` block for the full explanation.

        // --- LIGHT MODE ---
        light: {
          surface: {
            1: '#FFFFFF',
            2: '#F3F3F5',
            3: '#DDDDDD',
          },
          primary: '#2D2D2D',
          secondary: '#B0B0B0',
        },

        // --- STATIC DARK ---
        // A handful of header icon buttons (bell, people, gear, the
        // account/project switcher triggers) are meant to stay a dark
        // rounded chip in both themes rather than following the
        // adaptive `dark.*` tokens (which intentionally flip to light
        // colors in light mode — see the `@theme` comment in app.css).
        // These are literal hex, same technique as `light.*` above and
        // `.prose-note` in app.css, matching dark mode's default
        // `--color-dark-surface-*` / `--color-dark-primary` values.
        'static-dark': {
          surface: {
            2: '#242424',
            3: '#2E2E2E',
          },
          primary: '#F0F0F0',
          secondary: '#7B7B7B',
        },

        // --- ACCENT COLORS ---
        accent: {
          red: { light: '#FFB3B3', DEFAULT: '#D32F2F' },
          orange: { light: '#FFD1A1', DEFAULT: '#F57C00' },
          yellow: { light: '#FFF0B3', DEFAULT: '#FBC02D' },
          lime: { light: '#DCEDC8', DEFAULT: '#7CB342' },
          green: { light: '#B2DFDB', DEFAULT: '#00897B' },
          cyan: { light: '#B3E5FC', DEFAULT: '#0288D1' },
          blue: { light: '#C5CAE9', DEFAULT: '#3949AB' },
          purple: { light: '#E1BEE7', DEFAULT: '#8E24AA' },
          pink: { light: '#F8BBD0', DEFAULT: '#C2185B' },
          brown: { light: '#D7CCC8', DEFAULT: '#8D6E63' },
        },

        // --- STATUS COLORS ---
        status: {
          info: '#2F80ED',
          success: {
            DEFAULT: '#27AE60',
            str: '#1D860B',
          },
          warning: '#E2B93B',
          error: '#EB5757',
        },

        // --- LANDING (marketing) — dark-only, isolated from light mode ---
        // The public landing (welcome.tsx) must stay dark regardless of the
        // visitor's saved theme. app.tsx applies `html.light-mode` on every
        // page from localStorage, which recolors the adaptive `dark.*` tokens
        // (declared as CSS variables in app.css). These `landing.*` values are
        // literal hex, so Tailwind's @config compat layer bakes them per class
        // and the light-mode variable overrides never touch them — same
        // isolation technique as `static-dark`/`light` above and `.prose-note`
        // in app.css. Glow *gradients* live in app.css (`.landing-*`) for the
        // same reason. Do NOT move these into the @theme dark-* namespace.
        landing: {
          bg: '#0A0A0D',
          surface: '#131318',
          // surface-2/3 mirror the real product's dark-surface-2 (#242424) and
          // dark-surface-3 (#2E2E2E) so the self-made feature mockups read like
          // the actual app, while staying literal hex (immune to light mode).
          'surface-2': '#1C1C22',
          'surface-3': '#26262E',
          border: '#282830',
          'border-hover': '#3C3C48',
          primary: '#F3F3F6',
          secondary: '#A7A7B4',
          muted: '#6C6C7A',
          // Glow hues: brighter/more saturated cyan→blue→purple derived from
          // accent.cyan/blue/purple. Also mirrored as literal hex in the WebGL
          // hero canvas (HeroCanvas.tsx) and the glow gradients in app.css.
          glow: {
            cyan: '#22D3EE',
            blue: '#4F8BFF',
            purple: '#A970FF',
          },
          // Exact mirror of the real app's dark palette (the `--color-dark-*`
          // values in app.css). The embedded feature mockups use these so they
          // render identically to the live product, while staying literal hex
          // and therefore immune to the light-mode flip. Classes read as
          // bg-landing-app-1/2/3, text-landing-app-fg/sub, border-landing-app-line.
          app: {
            1: '#111111',
            2: '#242424',
            3: '#2E2E2E',
            fg: '#F0F0F0',
            sub: '#7B7B7B',
            line: '#3A3A3A',
          },
        },
      },
    },
  },
  plugins: [],
};
