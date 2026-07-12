import { useEffect, useState, useRef } from 'react';
import { getAccessToken } from './api';

const WS_URL = (import.meta as any).env.VITE_WS_URL || '';

export type SocketStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

export function useWebSocket(path: string, onEvent?: (event: string, data: any) => void) {
  const [status, setStatus] = useState<SocketStatus>(WS_URL ? 'connecting' : 'disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!WS_URL) {
      setStatus('disconnected');
      return;
    }

    let isClosedIntentionally = false;

    function connect() {
      try {
        const token = getAccessToken();
        const url = `${WS_URL}${path}${token ? `?token=${token}` : ''}`;
        
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
          setStatus('connected');
        };

        ws.onmessage = (event) => {
          try {
            const parsed = JSON.parse(event.data);
            if (onEvent && parsed.event && parsed.data) {
              onEvent(parsed.event, parsed.data);
            }
          } catch (err) {
            console.error('Failed to parse WebSocket message:', err);
          }
        };

        ws.onclose = () => {
          if (!isClosedIntentionally) {
            setStatus('reconnecting');
            reconnectTimeoutRef.current = setTimeout(connect, 3000); // retry in 3s
          } else {
            setStatus('disconnected');
          }
        };

        ws.onerror = (err) => {
          console.error('WebSocket error:', err);
          ws.close();
        };
      } catch (err) {
        console.error('Failed to instantiate WebSocket:', err);
        setStatus('reconnecting');
        reconnectTimeoutRef.current = setTimeout(connect, 5000);
      }
    }

    connect();

    return () => {
      isClosedIntentionally = true;
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [path, onEvent]);

  const sendEvent = (event: string, data: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ event, data }));
    } else {
      console.warn('WebSocket is not open. Event not sent:', event);
    }
  };

  const sendRaw = (payload: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    } else {
      console.warn('WebSocket is not open. Payload not sent:', payload);
    }
  };

  return { status, sendEvent, sendRaw };
}

// Specialized socket hook for Chat
export function useChatSocket(conversationId: string, onMessageReceived: (message: any) => void) {
  const { status, sendRaw } = useWebSocket('/ws/chat', (event, data) => {
    if (event === 'message:new' && data.conversation_id === conversationId) {
      onMessageReceived(data);
    }
  });

  // Listen to local simulated chat events when real WS is not connected
  useEffect(() => {
    if (status === 'disconnected' || !WS_URL) {
      const handleSimulatedMsg = (e: Event) => {
        const customEvent = e as CustomEvent;
        if (customEvent.detail && customEvent.detail.conversation_id === conversationId) {
          onMessageReceived(customEvent.detail);
        }
      };
      window.addEventListener('simulation-chat-message', handleSimulatedMsg);
      return () => {
        window.removeEventListener('simulation-chat-message', handleSimulatedMsg);
      };
    }
  }, [status, conversationId, onMessageReceived]);

  const sendChatMessage = (content: string) => {
    sendRaw({ type: 'message:new', conversation_id: conversationId, content });
  };

  return { status, sendChatMessage };
}

// Specialized socket hook for Notifications
export function useNotificationSocket(onNotificationReceived: (notification: any) => void) {
  const { status } = useWebSocket('/ws/notifications', (event, data) => {
    if (event === 'notification:new') {
      onNotificationReceived(data);
    }
  });

  return { status };
}
