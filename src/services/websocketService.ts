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
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isReconnecting = false;

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

        // Setup connection event listeners
        this.setupConnectionListeners();
        
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.log('info', 'WebSocket connected successfully');
      } else {
        this.log('warn', 'Laravel Echo not available');
        this.isConnected = false;
      }
    } catch (error: any) {
      this.log('error', 'Failed to initialize WebSocket', error);
      this.isConnected = false;
      this.scheduleReconnect();
    }
  }

  private setupConnectionListeners() {
    if (!this.echo) return;

    // Listen for connection events
    if (this.echo.connector && this.echo.connector.socket) {
      const socket = this.echo.connector.socket;
      
      socket.on('connect', () => {
        this.log('info', 'WebSocket connection established');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.isReconnecting = false;
      });

      socket.on('disconnect', () => {
        this.log('warn', 'WebSocket disconnected');
        this.isConnected = false;
        this.scheduleReconnect();
      });

      socket.on('error', (error: any) => {
        this.log('error', 'WebSocket error', error);
        this.isConnected = false;
      });

      socket.on('reconnect', () => {
        this.log('info', 'WebSocket reconnected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.isReconnecting = false;
      });
    }
  }

  private scheduleReconnect() {
    if (this.isReconnecting || this.reconnectAttempts >= this.maxReconnectAttempts) {
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.log('error', `Max reconnection attempts (${this.maxReconnectAttempts}) reached`);
      }
      return;
    }

    this.isReconnecting = true;
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff

    this.log('info', `Scheduling reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);

    this.reconnectTimer = setTimeout(() => {
      this.log('info', `Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      this.initializeEcho();
    }, delay);
  }

  private log(level: 'info' | 'warn' | 'error', message: string, error?: any) {
    const timestamp = new Date().toISOString();
    const logMessage = `[WebSocket ${timestamp}] ${message}`;
    
    if (level === 'error') {
      console.error(logMessage, error || '');
    } else if (level === 'warn') {
      console.warn(logMessage);
    } else {
      console.log(logMessage);
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
      if (this.echo) {
        this.echo.leave(channelName);
      }
      this.channels.delete(channelName);
    };
  }

  /**
   * Broadcast user activity
   */
  broadcastActivity(workspaceId: string, activity: {
    action: 'viewing' | 'editing' | 'idle';
    entityType?: string;
    entityId?: string;
    entityName?: string;
  }) {
    if (!this.echo || !this.isConnected) {
      return;
    }

    // This would typically be done via API call to backend
    // Backend then broadcasts the event
    // For now, we'll rely on the backend to handle this
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
    this.log('info', 'Disconnecting WebSocket');
    
    // Clear reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.channels.forEach((channel, name) => {
      try {
        if (channel && channel.unsubscribe) {
          channel.unsubscribe();
        }
      } catch (error: any) {
        this.log('error', `Error unsubscribing from channel ${name}`, error);
      }
    });
    this.channels.clear();
    this.listeners.clear();
    
    if (this.echo && this.echo.disconnect) {
      try {
        this.echo.disconnect();
      } catch (error: any) {
        this.log('error', 'Error disconnecting Echo', error);
      }
    }
    
    this.isConnected = false;
    this.isReconnecting = false;
    this.reconnectAttempts = 0;
  }

  /**
   * Check if connected
   */
  get connected() {
    return this.isConnected;
  }
}

export const websocketService = new WebSocketService();




