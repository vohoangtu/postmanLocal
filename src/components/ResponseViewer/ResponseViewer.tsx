import { useState, useMemo } from "react";
import Editor from "@monaco-editor/react";

interface ResponseViewerProps {
  response: any;
  responseTime?: number;
}

export default function ResponseViewer({ response, responseTime }: ResponseViewerProps) {
  const [activeView, setActiveView] = useState<"body" | "headers" | "cookies">("body");
  const [format, setFormat] = useState<"pretty" | "raw">("pretty");

  const bodyContent = useMemo(() => {
    if (!response?.body) return "";
    
    if (format === "pretty") {
      try {
        const parsed = JSON.parse(response.body);
        return JSON.stringify(parsed, null, 2);
      } catch {
        // Not JSON, try XML
        if (response.body.trim().startsWith("<")) {
          return response.body;
        }
        return response.body;
      }
    }
    return response.body;
  }, [response?.body, format]);

  const language = useMemo(() => {
    if (!response?.body) return "plaintext";
    
    try {
      JSON.parse(response.body);
      return "json";
    } catch {
      if (response.body.trim().startsWith("<")) {
        return "xml";
      }
      const contentType = response.headers?.["content-type"] || "";
      if (contentType.includes("html")) return "html";
      if (contentType.includes("css")) return "css";
      if (contentType.includes("javascript")) return "javascript";
      return "plaintext";
    }
  }, [response?.body, response?.headers]);

  const responseSize = useMemo(() => {
    if (!response?.body) return "0 B";
    const bytes = new Blob([response.body]).size;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }, [response?.body]);

  if (!response) {
    return (
      <div className="h-64 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4 flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400 text-center">
          No response yet. Send a request to see the response here.
        </p>
      </div>
    );
  }

  if (response.error) {
    return (
      <div className="h-64 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="text-red-600 dark:text-red-400">
          <p className="font-semibold mb-2">Error:</p>
          <pre className="text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded overflow-x-auto">
            {response.error}
          </pre>
        </div>
      </div>
    );
  }

  const downloadResponse = () => {
    const blob = new Blob([response.body], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `response-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(bodyContent);
      alert("Copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="h-64 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <span
              className={`px-3 py-1 rounded text-sm font-semibold ${
                response.status >= 200 && response.status < 300
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : response.status >= 400
                  ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
              }`}
            >
              {response.status} {response.statusText}
            </span>
            <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
              {responseTime && <span>Time: {responseTime}ms</span>}
              <span>Size: {responseSize}</span>
              <span>{new Date().toLocaleTimeString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFormat(format === "pretty" ? "raw" : "pretty")}
              className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              {format === "pretty" ? "Raw" : "Pretty"}
            </button>
            <button
              onClick={copyToClipboard}
              className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Copy
            </button>
            <button
              onClick={downloadResponse}
              className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Download
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveView("body")}
            className={`px-3 py-1 text-xs rounded ${
              activeView === "body"
                ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            Body
          </button>
          <button
            onClick={() => setActiveView("headers")}
            className={`px-3 py-1 text-xs rounded ${
              activeView === "headers"
                ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            Headers
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        {activeView === "body" ? (
          <Editor
            height="100%"
            language={language}
            value={bodyContent}
            theme="vs-dark"
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 12,
              wordWrap: "on",
              lineNumbers: "on",
            }}
          />
        ) : (
          <div className="h-full overflow-y-auto p-4">
            <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-x-auto">
              {JSON.stringify(response.headers || {}, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
