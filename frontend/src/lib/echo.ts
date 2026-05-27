import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Extend Window interface for Pusher
declare global {
  interface Window {
    Pusher: typeof Pusher;
  }
}

window.Pusher = Pusher;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let echoInstance: Echo<any> | null = null;

export const getEcho = () => {
  if (echoInstance) {
    return echoInstance;
  }

  const token = localStorage.getItem('token');
  if (!token) {
    return null;
  }

  echoInstance = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY || 'my-app-key',
    wsHost: import.meta.env.VITE_REVERB_HOST || 'localhost',
    wsPort: parseInt(import.meta.env.VITE_REVERB_PORT || '8080'),
    wssPort: parseInt(import.meta.env.VITE_REVERB_PORT || '8080'),
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME || 'http') === 'https',
    enabledTransports: ['ws'],
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    authEndpoint: `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/broadcasting/auth`,
  });

  return echoInstance;
};

export const disconnectEcho = () => {
  if (echoInstance) {
    echoInstance.disconnect();
    echoInstance = null;
  }
};

// Legacy default export for compatibility
const echo = {
  private: (channel: string) => {
    const echo = getEcho();
    if (!echo) {
      throw new Error('Echo not initialized - user not logged in');
    }
    return echo.private(channel);
  },
  leave: (channel: string) => {
    const echo = getEcho();
    if (echo) {
      echo.leave(channel);
    }
  },
  disconnect: () => {
    disconnectEcho();
  },
};

export default echo;
