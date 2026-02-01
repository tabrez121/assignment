import { useEffect, useState, useRef, useCallback } from 'react';

/**
 * WebSocket connection states
 */
export enum WebSocketState {
  CONNECTING = 'CONNECTING',
  OPEN = 'OPEN',
  CLOSING = 'CLOSING',
  CLOSED = 'CLOSED',
}

/**
 * WebSocket hook interface
 */
export interface UseWebSocketReturn {
  isConnected: boolean;
  lastMessage: unknown | null;
  sendMessage: (message: unknown) => void;
  state: WebSocketState;
  error: Error | null;
  reconnect: () => void;
}

/**
 * Custom hook for WebSocket connections
 *
 * Features:
 * - Automatic connection lifecycle management
 * - Automatic reconnection with exponential backoff
 * - Message sending and receiving
 * - Error handling
 * - Connection state tracking
 *
 * @param url - WebSocket URL to connect to
 * @param options - Configuration options
 * @returns WebSocket state and methods
 *
 * @example
 * ```typescript
 * const { isConnected, lastMessage, sendMessage } = useWebSocket(
 *   'ws://localhost:8080/api/events'
 * );
 *
 * useEffect(() => {
 *   if (lastMessage) {
 *     console.log('New message:', lastMessage);
 *   }
 * }, [lastMessage]);
 *
 * const handleClick = () => {
 *   sendMessage({ type: 'test', data: 'hello' });
 * };
 * ```
 */
export const useWebSocket = (
  url: string,
  options?: {
    maxRetries?: number;
    retryDelay?: number;
    shouldReconnect?: boolean;
    onMessage?: (message: unknown) => void;
    onError?: (error: Error) => void;
    onConnect?: () => void;
    onDisconnect?: () => void;
  }
): UseWebSocketReturn => {
  const [state, setState] = useState<WebSocketState>(WebSocketState.CLOSED);
  const [lastMessage, setLastMessage] = useState<unknown | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const webSocketRef = useRef<WebSocket | null>(null);
  const retriesRef = useRef(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout>();
  const messageQueueRef = useRef<unknown[]>([]);
  const connectRef = useRef<(() => void) | null>(null);

  const {
    maxRetries = 5,
    retryDelay = 1000,
    shouldReconnect = true,
    onMessage,
    onError,
    onConnect,
    onDisconnect,
  } = options || {};

  /**
   * Connect to WebSocket
   */
  const connect = useCallback(() => {
    // Don't create a new connection if one already exists in OPEN state
    if (webSocketRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    // Close any existing connection before creating a new one
    if (webSocketRef.current && webSocketRef.current.readyState !== WebSocket.CLOSED) {
      webSocketRef.current.close();
    }

    try {
      setState(WebSocketState.CONNECTING);
      const ws = new WebSocket(url);
      let connectionTimeoutId: NodeJS.Timeout | null = null;

      // Set connection timeout (5 seconds)
      connectionTimeoutId = setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          console.warn('⏱️ WebSocket connection timeout after 5s');
          ws.close();
        }
      }, 5000);

      const handleOpen = () => {
        if (connectionTimeoutId) clearTimeout(connectionTimeoutId);
        console.log('✅ WebSocket connected');
        setState(WebSocketState.OPEN);
        retriesRef.current = 0;
        setError(null);

        // Send any queued messages
        while (messageQueueRef.current.length > 0) {
          const msg = messageQueueRef.current.shift();
          if (msg !== undefined && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(msg));
          }
        }

        onConnect?.();
      };

      const handleMessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
          onMessage?.(data);
        } catch (parseError) {
          console.error('Failed to parse WebSocket message:', event.data);
        }
      };

      const handleError = () => {
        if (connectionTimeoutId) clearTimeout(connectionTimeoutId);
        console.error('❌ WebSocket error - connection failed');
        const wsError = new Error('WebSocket connection failed - using mock data');
        setError(wsError);
        onError?.(wsError);
      };

      const handleClose = () => {
        if (connectionTimeoutId) clearTimeout(connectionTimeoutId);
        setState(WebSocketState.CLOSED);
        onDisconnect?.();

        // Remove event listeners to prevent memory leaks
        ws.removeEventListener('open', handleOpen);
        ws.removeEventListener('message', handleMessage);
        ws.removeEventListener('error', handleError);
        ws.removeEventListener('close', handleClose);

        // Attempt to reconnect
        if (shouldReconnect && retriesRef.current < maxRetries) {
          retriesRef.current += 1;
          const delay = retryDelay * Math.pow(2, retriesRef.current - 1);
          console.log(`⚠️ WebSocket reconnecting in ${delay}ms (attempt ${retriesRef.current}/${maxRetries})`);

          retryTimeoutRef.current = setTimeout(() => {
            connectRef.current?.();
          }, delay);
        } else if (shouldReconnect && retriesRef.current >= maxRetries) {
          console.log('📊 WebSocket unavailable - demo mode active with sample data');
          const maxRetriesError = new Error('Real-time updates unavailable - demo mode active');
          setError(maxRetriesError);
          onError?.(maxRetriesError);
        }
      };

      ws.addEventListener('open', handleOpen);
      ws.addEventListener('message', handleMessage);
      ws.addEventListener('error', handleError);
      ws.addEventListener('close', handleClose);

      webSocketRef.current = ws;
    } catch (err) {
      const connectionError = err instanceof Error ? err : new Error(String(err));
      console.error('❌ WebSocket creation error:', connectionError.message);
      setError(connectionError);
      onError?.(connectionError);
      setState(WebSocketState.CLOSED);
    }
  }, [url, maxRetries, retryDelay, shouldReconnect, onMessage, onError, onConnect, onDisconnect]);

  /**
   * Send message through WebSocket
   */
  const sendMessage = useCallback((message: unknown) => {
    if (webSocketRef.current?.readyState === WebSocket.OPEN) {
      try {
        webSocketRef.current.send(JSON.stringify(message));
      } catch (err) {
        const sendError = err instanceof Error ? err : new Error(String(err));
        setError(sendError);
        onError?.(sendError);
      }
    } else {
      // Queue message if not connected
      messageQueueRef.current.push(message);
      console.warn('WebSocket not connected. Message queued.');
    }
  }, [onError]);

  /**
   * Manually reconnect
   */
  const reconnect = useCallback(() => {
    console.log('🔄 Manual reconnection requested');
    if (webSocketRef.current) {
      webSocketRef.current.close();
    }
    retriesRef.current = 0;
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    setError(null);
    
    // Use the stored connect function to trigger reconnection with full retry logic
    if (connectRef.current) {
      connectRef.current();
    }
  }, []);

  /**
   * Store connect function in ref for reconnect to use
   */
  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  /**
   * Setup connection on mount, cleanup on unmount
   */
  useEffect(() => {
    // Only establish connection once on mount
    connect();

    return () => {
      // Cleanup on unmount
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (webSocketRef.current) {
        webSocketRef.current.close();
      }
    };
    // Only run once on mount - intentionally exclude connect from dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    isConnected: state === WebSocketState.OPEN,
    lastMessage,
    sendMessage,
    state,
    error,
    reconnect,
  };
};
