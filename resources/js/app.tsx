import { createInertiaApp } from '@inertiajs/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

const pages = import.meta.glob('./pages/**/*.tsx');

createInertiaApp({
  title: (title) => (title ? `${title} - ${appName}` : appName),
   
  resolve: async (name) =>
    ((await pages[`./pages/${name}.tsx`]()) as any).default,
  setup({ el, App, props }) {
    createRoot(el).render(
      <StrictMode>
        <App {...props} />
      </StrictMode>,
    );
  },
  progress: {
    color: '#4B5563',
  },
});
