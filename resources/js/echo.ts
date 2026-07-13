import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { inertiaJson } from '@/lib/inertiaJson';

declare global {
  interface Window {
    Pusher: typeof Pusher;
  }
}

window.Pusher = Pusher;

const REVERB_KEY = import.meta.env.VITE_REVERB_APP_KEY as string | undefined;
const accountAuthEndpoint = (): string => {
  const accountIndex =
    window.location.pathname.match(/^\/u\/(\d+)(?:\/|$)/)?.[1];

  return accountIndex
    ? `/u/${accountIndex}/broadcasting/auth`
    : '/broadcasting/auth';
};

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
  // The account index must be part of private/presence-channel auth. Using
  // the legacy unscoped endpoint makes two tabs signed in as different
  // accounts race on the session's active account and intermittently reject
  // otherwise valid subscriptions.
  authEndpoint: accountAuthEndpoint(),
  channelAuthorization: {
    customHandler: (params, callback) => {
      void inertiaJson<{ auth: string; channel_data?: string }>(
        'post',
        accountAuthEndpoint(),
        {
          data: {
            socket_id: params.socketId,
            channel_name: params.channelName,
          },
        },
      )
        .then((data) => callback(null, data))
        .catch((error: unknown) =>
          callback(
            error instanceof Error
              ? error
              : new Error('Channel authorization failed'),
            null,
          ),
        );
    },
  },
  withCredentials: true,
});

export default echo;
