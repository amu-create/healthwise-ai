import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { initWebSocket, getWebSocketService } from '../services/websocketService';
import { useSnackbar } from 'notistack';
import { useTranslation } from 'react-i18next';
import React from 'react';

interface UseWebSocketOptions {
  onNotification?: (notification: any) => void;
  onConnect?: () => void;
  onDisconnect?: (event: CloseEvent) => void;
  onError?: (error: any) => void;
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const { user, token } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation();
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<ReturnType<typeof initWebSocket> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio for notification sound
  useEffect(() => {
    audioRef.current = new Audio('/sounds/notification.mp3');
    audioRef.current.volume = 0.5;
  }, []);

  const playNotificationSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play().catch(err => {
        console.log('Failed to play notification sound:', err);
      });
    }
  }, []);

  const showNotificationToast = useCallback((notification: any) => {
    const message = notification.message || notification.title || t('notifications.newNotification');
    
    enqueueSnackbar(message, {
      variant: 'info',
      anchorOrigin: {
        vertical: 'top',
        horizontal: 'right',
      },
      autoHideDuration: 5000,
      action: (key) => React.createElement(
        'button',
        {
          onClick: () => {
            window.location.href = '/notifications';
          },
          style: {
            color: '#fff',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            textDecoration: 'underline',
          }
        },
        t('notifications.view')
      ),
    });
  }, [enqueueSnackbar, t]);

  const connect = useCallback(async () => {
    if (!user || (user as any).is_guest) {
      console.log('WebSocket not available for guest users');
      return;
    }

    const authToken = token || localStorage.getItem('authToken');
    if (!authToken) {
      console.log('No auth token available');
      return;
    }

    // Get WebSocket URL based on environment
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = process.env.REACT_APP_WS_HOST || window.location.host;
    const wsUrl = `${protocol}//${host}/ws/notifications/`;

    if (!wsRef.current) {
      wsRef.current = initWebSocket({ url: wsUrl });

      // Set up event handlers
      wsRef.current.on('connected', () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        options.onConnect?.();
      });

      wsRef.current.on('disconnected', (event: any) => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        options.onDisconnect?.(event);
      });

      wsRef.current.on('notification', (notification: any) => {
        console.log('New notification:', notification);
        
        // Play sound
        playNotificationSound();
        
        // Show toast
        showNotificationToast(notification);
        
        // Call custom handler
        options.onNotification?.(notification);
        
        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('newNotification', { 
          detail: notification 
        }));
      });

      wsRef.current.on('error', (error: any) => {
        console.error('WebSocket error:', error);
        options.onError?.(error);
      });
    }

    wsRef.current.connect(authToken);
  }, [user, token, options, playNotificationSound, showNotificationToast]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.disconnect();
    }
  }, []);

  const sendMessage = useCallback((data: any) => {
    if (wsRef.current && wsRef.current.isConnected()) {
      wsRef.current.send(data);
    } else {
      console.warn('WebSocket not connected');
    }
  }, []);

  // Connect when user logs in
  useEffect(() => {
    if (user && !(user as any).is_guest) {
      connect();
    }

    return () => {
      if (wsRef.current) {
        disconnect();
      }
    };
  }, [user, connect, disconnect]);

  // Reconnect on window focus
  useEffect(() => {
    const handleFocus = () => {
      if (user && !(user as any).is_guest && wsRef.current && !wsRef.current.isConnected()) {
        connect();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user, connect]);

  return {
    isConnected,
    connect,
    disconnect,
    sendMessage,
  };
};
