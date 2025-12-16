/**
 * WebSocket Service for Real-time Collaboration
 * 
 * Note: This requires a WebSocket server to be running.
 * Options:
 * 1. Laravel Echo Server (https://github.com/tlaverdure/laravel-echo-server)
 * 2. Pusher (https://pusher.com)
 * 3. Ably (https://ably.com)
 * 
 * Configure in backend/config/broadcasting.php
 */

interface WebSocketConfig {
  host?: string;
  port?: number;
  key?: string;
  authEndpoint?: string;
}

class WebSocketService {
  private echo: any = null;
  private channels: Map<string, any> = new Map();
  private listeners: Map<string, Set<Function>> = new Map();
  private isConnected = false;

  constructor() {
    // Dynamic import of Laravel Echo
    if (typeof window !== "undefined") {
      this.initializeEcho();
    }
  }

  private async initializeEcho() {
    try {
      // Check if Laravel Echo is available
      if (typeof window !== "undefined" && (window as any).Echo) {
        const Echo = (window as any).Echo;
        const token = localStorage.getItem("auth_token");
        
        this.echo = new Echo({
          broadcaster: "pusher", // or 'socket.io' for Laravel Echo Server
          key: import.meta.env.VITE_PUSHER_APP_KEY || "your-app-key",
          cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER || "mt1",
          encrypted: true,
          authEndpoint: `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"}/broadcasting/auth`,
          auth: {
            headers: {
              Authorization: token ? `Bearer ${token}` : "",
            },
          },
        });

        this.isConnected = true;
      }
    } catch (error) {
      console.warn("WebSocket not available:", error);
      this.isConnected = false;
    }
  }

  /**
   * Subscribe to a private channel
   */
  subscribe(channelName: string, eventName: string, callback: Function) {
    if (!this.echo || !this.isConnected) {
      console.warn("WebSocket not connected, skipping subscription");
      return () => {};
    }

    const key = `${channelName}.${eventName}`;
    
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(callback);

    if (!this.channels.has(channelName)) {
      const channel = this.echo.private(channelName);
      this.channels.set(channelName, channel);
    }

    const channel = this.channels.get(channelName);
    channel.listen(eventName, callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(key);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          channel.stopListening(eventName);
          this.listeners.delete(key);
        }
      }
    };
  }

  /**
   * Subscribe to a presence channel (for user presence)
   */
  subscribePresence(channelName: string, callbacks: {
    here?: (users: any[]) => void;
    joining?: (user: any) => void;
    leaving?: (user: any) => void;
  }) {
    if (!this.echo || !this.isConnected) {
      console.warn("WebSocket not connected, skipping presence subscription");
      return () => {};
    }

    const channel = this.echo.join(channelName)
      .here(callbacks.here || (() => {}))
      .joining(callbacks.joining || (() => {}))
      .leaving(callbacks.leaving || (() => {}));

    this.channels.set(channelName, channel);

    return () => {
      this.echo.leave(channelName);
      this.channels.delete(channelName);
    };
  }

  /**
   * Unsubscribe from a channel
   */
  unsubscribe(channelName: string) {
    if (this.channels.has(channelName)) {
      const channel = this.channels.get(channelName);
      if (channel && channel.unsubscribe) {
        channel.unsubscribe();
      }
      this.channels.delete(channelName);
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect() {
    this.channels.forEach((channel, name) => {
      if (channel && channel.unsubscribe) {
        channel.unsubscribe();
      }
    });
    this.channels.clear();
    this.listeners.clear();
    
    if (this.echo && this.echo.disconnect) {
      this.echo.disconnect();
    }
    
    this.isConnected = false;
  }

  /**
   * Check if connected
   */
  get connected() {
    return this.isConnected;
  }
}

export const websocketService = new WebSocketService();




