import { useEffect, useRef } from "react";
import { websocketService } from "../services/websocketService";

interface UseWebSocketOptions {
  channel: string;
  event?: string;
  onMessage?: (data: any) => void;
  enabled?: boolean;
}

/**
 * Hook for subscribing to WebSocket channels
 */
export function useWebSocket(options: UseWebSocketOptions) {
  const { channel, event, onMessage, enabled = true } = options;
  const callbackRef = useRef(onMessage);

  useEffect(() => {
    callbackRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!enabled || !channel) return;

    if (event && onMessage) {
      const unsubscribe = websocketService.subscribe(channel, event, (data: any) => {
        callbackRef.current?.(data);
      });

      return unsubscribe;
    }
  }, [channel, event, enabled]);

  return {
    connected: websocketService.connected,
  };
}

/**
 * Hook for presence channels (user online/offline)
 */
export function usePresenceChannel(
  channel: string,
  callbacks: {
    here?: (users: any[]) => void;
    joining?: (user: any) => void;
    leaving?: (user: any) => void;
  },
  enabled = true
) {
  useEffect(() => {
    if (!enabled || !channel) return;

    const unsubscribe = websocketService.subscribePresence(channel, callbacks);

    return unsubscribe;
  }, [channel, enabled, callbacks.here, callbacks.joining, callbacks.leaving]);

  return {
    connected: websocketService.connected,
  };
}





