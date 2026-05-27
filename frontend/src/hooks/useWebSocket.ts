import { useEffect, useRef } from 'react';
import Pusher from 'pusher-js';
import { useQueryClient } from '@tanstack/react-query';

export const useWebSocket = <T = unknown>(userId: number | undefined, onNotification?: (notification: T) => void) => {
  const queryClient = useQueryClient();
  const pusherRef = useRef<Pusher | null>(null);
  const onNotificationRef = useRef(onNotification);
  
  // Update ref when callback changes
  useEffect(() => {
    onNotificationRef.current = onNotification;
  }, [onNotification]);

  useEffect(() => {
    if (!userId) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const key = import.meta.env.VITE_REVERB_APP_KEY || 'my-app-key';
    const host = import.meta.env.VITE_REVERB_HOST || 'localhost';
    const port = parseInt(import.meta.env.VITE_REVERB_PORT || '8080');

    console.log('[WebSocket] Creating Pusher connection:', { key, host, port });

    // Create Pusher connection to Reverb
    const pusher = new Pusher(key, {
      cluster: 'mt1',
      wsHost: host,
      wsPort: port,
      wssPort: port,
      wsPath: '',
      enabledTransports: ['ws'],
      forceTLS: false,
      disableStats: true,
      authEndpoint: `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/broadcasting/auth`,
      auth: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    pusherRef.current = pusher;

    // Connection events
    pusher.connection.bind('connected', () => {
      console.log('[WebSocket] Pusher connected!');
    });

    pusher.connection.bind('disconnected', () => {
      console.log('[WebSocket] Pusher disconnected');
    });

    pusher.connection.bind('error', (err: unknown) => {
      console.log('[WebSocket] Pusher error:', err);
    });

    // Subscribe to private channel
    const channelName = `private-user.${userId}`;
    console.log('[WebSocket] Subscribing to:', channelName);

    const channel = pusher.subscribe(channelName);

    channel.bind('pusher:subscription_succeeded', () => {
      console.log('[WebSocket] Subscription succeeded for', channelName);
    });

    channel.bind('pusher:subscription_error', (err: unknown) => {
      console.log('[WebSocket] Subscription error:', err);
    });

    // Listen for notification events - try multiple formats
    channel.bind('notification.created', (event: unknown) => {
      console.log('[WebSocket] notification.created received:', event);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      onNotificationRef.current?.(event as T);
    });
    
    // Also try with App\Events prefix (Laravel default)
    channel.bind('App\\Events\\NotificationCreated', (event: unknown) => {
      console.log('[WebSocket] App\\Events\\NotificationCreated received:', event);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      onNotificationRef.current?.(event as T);
    });
    
    // Listen to all events for debug
    channel.bind_global((eventName: string, event: unknown) => {
      console.log('[WebSocket] All events:', eventName, event);
    });

    return () => {
      console.log('[WebSocket] Unsubscribing from', channelName);
      pusher.unsubscribe(channelName);
      pusher.disconnect();
      pusherRef.current = null;
    };
  }, [userId, queryClient]);
};
