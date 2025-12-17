/**
 * useWorkspaceWebSocket Hook
 * Reusable hook cho WebSocket subscriptions trong workspace
 */

import { useEffect, useRef } from 'react';
import { websocketService } from '../services/websocketService';

export interface WebSocketSubscription {
  channel: string;
  event: string;
  handler: (data: unknown) => void;
}

/**
 * Hook để subscribe WebSocket events cho workspace
 */
export function useWorkspaceWebSocket(
  workspaceId: string | undefined,
  subscriptions: WebSocketSubscription[]
): void {
  const unsubscribeRefs = useRef<Array<() => void>>([]);

  useEffect(() => {
    if (!workspaceId || subscriptions.length === 0) {
      return;
    }

    // Cleanup previous subscriptions
    unsubscribeRefs.current.forEach((unsubscribe) => unsubscribe());
    unsubscribeRefs.current = [];

    // Subscribe to all events
    subscriptions.forEach(({ channel, event, handler }) => {
      const channelName = channel.includes('workspace') 
        ? channel 
        : `private-workspace.${workspaceId}`;
      
      const unsubscribe = websocketService.subscribe(channelName, event, handler);
      unsubscribeRefs.current.push(unsubscribe);
    });

    // Cleanup function
    return () => {
      unsubscribeRefs.current.forEach((unsubscribe) => unsubscribe());
      unsubscribeRefs.current = [];
    };
  }, [workspaceId, subscriptions]);
}

/**
 * Hook để subscribe một WebSocket event đơn giản
 */
export function useWorkspaceEvent(
  workspaceId: string | undefined,
  event: string,
  handler: (data: unknown) => void
): void {
  useWorkspaceWebSocket(workspaceId, [
    {
      channel: `private-workspace.${workspaceId || ''}`,
      event,
      handler,
    },
  ]);
}

export default useWorkspaceWebSocket;
