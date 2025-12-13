/**
 * WebSocket Test Service - Xử lý WebSocket connections và messages
 */

export interface WebSocketMessage {
  id: string;
  type: "sent" | "received";
  content: string;
  timestamp: Date;
  format: "json" | "text" | "binary";
}

export interface WebSocketConnection {
  url: string;
  protocol?: string;
  status: "connecting" | "connected" | "disconnected" | "error";
  messages: WebSocketMessage[];
  reconnectAttempts: number;
  autoReconnect: boolean;
}

class WebSocketTestService {
  private connections: Map<string, WebSocket> = new Map();
  private connectionData: Map<string, WebSocketConnection> = new Map();
  private messageListeners: Map<string, Set<(message: WebSocketMessage) => void>> = new Map();
  private statusListeners: Map<string, Set<(status: string) => void>> = new Map();

  /**
   * Connect to WebSocket
   */
  connect(
    id: string,
    url: string,
    protocol?: string,
    autoReconnect: boolean = false
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.connections.has(id)) {
        this.disconnect(id);
      }

      try {
        const ws = protocol ? new WebSocket(url, protocol) : new WebSocket(url);
        
        const connectionData: WebSocketConnection = {
          url,
          protocol,
          status: "connecting",
          messages: [],
          reconnectAttempts: 0,
          autoReconnect,
        };
        this.connectionData.set(id, connectionData);

        ws.onopen = () => {
          connectionData.status = "connected";
          connectionData.reconnectAttempts = 0;
          this.notifyStatusListeners(id, "connected");
          resolve();
        };

        ws.onmessage = (event) => {
          const format = this.detectMessageFormat(event.data);
          const message: WebSocketMessage = {
            id: Date.now().toString(),
            type: "received",
            content: this.formatMessage(event.data, format),
            timestamp: new Date(),
            format,
          };
          
          connectionData.messages.push(message);
          this.notifyMessageListeners(id, message);
        };

        ws.onerror = (error) => {
          connectionData.status = "error";
          this.notifyStatusListeners(id, "error");
          reject(error);
        };

        ws.onclose = (event) => {
          connectionData.status = "disconnected";
          this.notifyStatusListeners(id, "disconnected");
          this.connections.delete(id);

          // Auto-reconnect logic
          if (autoReconnect && connectionData.reconnectAttempts < 5) {
            connectionData.reconnectAttempts++;
            setTimeout(() => {
              this.connect(id, url, protocol, autoReconnect).catch(() => {
                // Retry failed, will stop after 5 attempts
              });
            }, 1000 * connectionData.reconnectAttempts);
          }
        };

        this.connections.set(id, ws);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(id: string): void {
    const ws = this.connections.get(id);
    if (ws) {
      ws.close();
      this.connections.delete(id);
    }
    
    const connectionData = this.connectionData.get(id);
    if (connectionData) {
      connectionData.status = "disconnected";
      connectionData.autoReconnect = false;
    }
  }

  /**
   * Send message
   */
  send(id: string, message: string, format: "json" | "text" = "text"): boolean {
    const ws = this.connections.get(id);
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      let dataToSend: string | ArrayBuffer;
      
      if (format === "json") {
        // Validate JSON
        JSON.parse(message);
        dataToSend = message;
      } else if (format === "binary") {
        // Convert hex string to ArrayBuffer
        dataToSend = this.hexToArrayBuffer(message);
      } else {
        dataToSend = message;
      }

      ws.send(dataToSend);

      const connectionData = this.connectionData.get(id);
      if (connectionData) {
        const sentMessage: WebSocketMessage = {
          id: Date.now().toString(),
          type: "sent",
          content: message,
          timestamp: new Date(),
          format,
        };
        connectionData.messages.push(sentMessage);
        this.notifyMessageListeners(id, sentMessage);
      }

      return true;
    } catch (error) {
      console.error("Failed to send message:", error);
      return false;
    }
  }

  /**
   * Get connection status
   */
  getStatus(id: string): string | null {
    const connectionData = this.connectionData.get(id);
    return connectionData?.status || null;
  }

  /**
   * Get messages
   */
  getMessages(id: string): WebSocketMessage[] {
    const connectionData = this.connectionData.get(id);
    return connectionData?.messages || [];
  }

  /**
   * Clear messages
   */
  clearMessages(id: string): void {
    const connectionData = this.connectionData.get(id);
    if (connectionData) {
      connectionData.messages = [];
    }
  }

  /**
   * Subscribe to messages
   */
  onMessage(id: string, callback: (message: WebSocketMessage) => void): () => void {
    if (!this.messageListeners.has(id)) {
      this.messageListeners.set(id, new Set());
    }
    this.messageListeners.get(id)!.add(callback);

    return () => {
      const listeners = this.messageListeners.get(id);
      if (listeners) {
        listeners.delete(callback);
      }
    };
  }

  /**
   * Subscribe to status changes
   */
  onStatusChange(id: string, callback: (status: string) => void): () => void {
    if (!this.statusListeners.has(id)) {
      this.statusListeners.set(id, new Set());
    }
    this.statusListeners.get(id)!.add(callback);

    return () => {
      const listeners = this.statusListeners.get(id);
      if (listeners) {
        listeners.delete(callback);
      }
    };
  }

  private notifyMessageListeners(id: string, message: WebSocketMessage): void {
    const listeners = this.messageListeners.get(id);
    if (listeners) {
      listeners.forEach((callback) => callback(message));
    }
  }

  private notifyStatusListeners(id: string, status: string): void {
    const listeners = this.statusListeners.get(id);
    if (listeners) {
      listeners.forEach((callback) => callback(status));
    }
  }

  private detectMessageFormat(data: any): "json" | "text" | "binary" {
    if (data instanceof ArrayBuffer) {
      return "binary";
    }
    if (typeof data === "string") {
      try {
        JSON.parse(data);
        return "json";
      } catch {
        return "text";
      }
    }
    return "text";
  }

  private formatMessage(data: any, format: "json" | "text" | "binary"): string {
    if (format === "binary") {
      return Array.from(new Uint8Array(data))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(" ");
    }
    if (format === "json") {
      try {
        return JSON.stringify(JSON.parse(data), null, 2);
      } catch {
        return String(data);
      }
    }
    return String(data);
  }

  private hexToArrayBuffer(hex: string): ArrayBuffer {
    const bytes = hex
      .replace(/\s/g, "")
      .match(/.{1,2}/g)
      ?.map((byte) => parseInt(byte, 16)) || [];
    return new Uint8Array(bytes).buffer;
  }
}

export const websocketTestService = new WebSocketTestService();


