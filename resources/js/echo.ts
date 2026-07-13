import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

declare global {
  interface Window {
    Pusher: typeof Pusher;
  }
}

window.Pusher = Pusher;

const REVERB_KEY = import.meta.env.VITE_REVERB_APP_KEY as string | undefined;

if (!REVERB_KEY) {
  console.warn(
    '[Echo] VITE_REVERB_APP_KEY is not set — real-time features are disabled. ' +
      'Add the REVERB_* variables to your .env and restart the dev server.',
  );
}

const echo = new Echo({
  broadcaster: 'reverb',
  key: REVERB_KEY ?? 'not-configured',
  wsHost: import.meta.env.VITE_REVERB_HOST ?? '127.0.0.1',
  wsPort: parseInt(import.meta.env.VITE_REVERB_PORT ?? '8080'),
  wssPort: parseInt(import.meta.env.VITE_REVERB_PORT ?? '8080'),
  forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'http') === 'https',
  enabledTransports: ['ws', 'wss'],
  authEndpoint: '/broadcasting/auth',
  withCredentials: true,
});

export default echo;
