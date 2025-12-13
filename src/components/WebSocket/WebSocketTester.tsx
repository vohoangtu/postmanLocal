import { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import Button from "../UI/Button";
import ComponentErrorBoundary from "../Error/ComponentErrorBoundary";
import { useToast } from "../../hooks/useToast";
import { websocketTestService, WebSocketMessage } from "../../services/websocketTestService";
import { Play, Square, Trash2, Send, Wifi, WifiOff, Loader2 } from "lucide-react";

interface WebSocketTesterProps {
  url: string;
  headers?: Record<string, string>;
  onMessage?: (message: WebSocketMessage) => void;
}

export default function WebSocketTester({
  url,
  headers,
  onMessage,
}: WebSocketTesterProps) {
  const [connectionId] = useState(() => `ws-${Date.now()}`);
  const [status, setStatus] = useState<"connecting" | "connected" | "disconnected" | "error">("disconnected");
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [messageFormat, setMessageFormat] = useState<"json" | "text" | "binary">("text");
  const [protocol, setProtocol] = useState("");
  const [autoReconnect, setAutoReconnect] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const toast = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribeMessage = websocketTestService.onMessage(connectionId, (message) => {
      setMessages((prev) => [...prev, message]);
      onMessage?.(message);
      scrollToBottom();
    });

    const unsubscribeStatus = websocketTestService.onStatusChange(connectionId, (newStatus) => {
      setStatus(newStatus as any);
      if (newStatus === "connected") {
        toast.success("WebSocket connected");
      } else if (newStatus === "disconnected") {
        toast.info("WebSocket disconnected");
      } else if (newStatus === "error") {
        toast.error("WebSocket connection error");
      }
    });

    return () => {
      unsubscribeMessage();
      unsubscribeStatus();
      websocketTestService.disconnect(connectionId);
    };
  }, [connectionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleConnect = async () => {
    if (!url) {
      toast.error("Please enter a WebSocket URL");
      return;
    }

    setConnecting(true);
    try {
      await websocketTestService.connect(connectionId, url, protocol || undefined, autoReconnect);
    } catch (error: any) {
      toast.error(error.message || "Failed to connect");
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    websocketTestService.disconnect(connectionId);
  };

  const handleSend = () => {
    if (!messageInput.trim()) {
      toast.error("Please enter a message");
      return;
    }

    if (messageFormat === "json") {
      try {
        JSON.parse(messageInput);
      } catch {
        toast.error("Invalid JSON");
        return;
      }
    }

    const success = websocketTestService.send(connectionId, messageInput, messageFormat);
    if (!success) {
      toast.error("Failed to send message. Check connection status.");
    } else {
      setMessageInput("");
    }
  };

  const handleClear = () => {
    websocketTestService.clearMessages(connectionId);
    setMessages([]);
  };

  const getStatusColor = () => {
    switch (status) {
      case "connected":
        return "text-green-600 dark:text-green-400";
      case "connecting":
        return "text-yellow-600 dark:text-yellow-400";
      case "error":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "connected":
        return <Wifi size={16} className="text-green-600 dark:text-green-400" />;
      case "connecting":
        return <Loader2 size={16} className="text-yellow-600 dark:text-yellow-400 animate-spin" />;
      case "error":
        return <WifiOff size={16} className="text-red-600 dark:text-red-400" />;
      default:
        return <WifiOff size={16} className="text-gray-600 dark:text-gray-400" />;
    }
  };

  return (
    <ComponentErrorBoundary componentName="WebSocket Tester">
      <div className="flex flex-col h-full">
      {/* Connection Controls */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={url}
            readOnly
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
            placeholder="WebSocket URL (ws:// or wss://)"
          />
          <input
            type="text"
            value={protocol}
            onChange={(e) => setProtocol(e.target.value)}
            placeholder="Protocol (optional)"
            className="w-40 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1 ${getStatusColor()}`}>
              {getStatusIcon()}
              <span className="text-sm font-medium capitalize">{status}</span>
            </div>
            {status === "disconnected" ? (
              <Button
                variant="primary"
                size="sm"
                onClick={handleConnect}
                disabled={connecting || !url}
                loading={connecting}
              >
                <Play size={14} className="mr-1" />
                Connect
              </Button>
            ) : (
              <Button
                variant="danger"
                size="sm"
                onClick={handleDisconnect}
              >
                <Square size={14} className="mr-1" />
                Disconnect
              </Button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={autoReconnect}
              onChange={(e) => setAutoReconnect(e.target.checked)}
              className="w-4 h-4"
            />
            Auto-reconnect
          </label>
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
          >
            <Trash2 size={14} className="mr-1" />
            Clear Messages
          </Button>
        </div>
      </div>

      {/* Messages History */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50 dark:bg-gray-900">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            No messages yet. Connect and send a message to start.
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`p-3 rounded border ${
                message.type === "sent"
                  ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 ml-8"
                  : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 mr-8"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {message.type === "sent" ? "Sent" : "Received"} ({message.format})
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <pre className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap break-words font-mono">
                {message.content}
              </pre>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
        <div className="flex items-center gap-2">
          <select
            value={messageFormat}
            onChange={(e) => setMessageFormat(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="text">Text</option>
            <option value="json">JSON</option>
            <option value="binary">Binary (Hex)</option>
          </select>
          <div className="flex-1">
            {messageFormat === "json" ? (
              <Editor
                height="120px"
                defaultLanguage="json"
                value={messageInput}
                onChange={(value) => setMessageInput(value || "")}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 12,
                  wordWrap: "on",
                }}
              />
            ) : (
              <textarea
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder={messageFormat === "binary" ? "Enter hex string (e.g., 48 65 6c 6c 6f)" : "Enter message"}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                rows={3}
              />
            )}
          </div>
          <Button
            variant="primary"
            onClick={handleSend}
            disabled={status !== "connected" || !messageInput.trim()}
          >
            <Send size={14} className="mr-1" />
            Send
          </Button>
        </div>
      </div>
    </div>
    </ComponentErrorBoundary>
  );
}


