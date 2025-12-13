import { useState } from "react";
import { useRequestHistoryStore, RequestHistoryItem } from "../../stores/requestHistoryStore";
import { useTabStore } from "../../stores/tabStore";
import EmptyState from "../EmptyStates/EmptyState";
import Button from "../UI/Button";
import { History, Search } from "lucide-react";

export default function RequestHistory() {
  const { history, clearHistory, removeFromHistory } = useRequestHistoryStore();
  const { addTab } = useTabStore();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredHistory = history.filter(
    (item) =>
      item.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.method.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenInNewTab = (item: RequestHistoryItem) => {
    addTab({
      name: `${item.method} ${new URL(item.url).pathname}`,
      method: item.method,
      url: item.url,
    });
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Request History
          </h3>
          {history.length > 0 && (
            <Button
              variant="link"
              size="sm"
              onClick={clearHistory}
              className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
            >
              Clear All
            </Button>
          )}
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search history..."
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {filteredHistory.length === 0 ? (
          <EmptyState
            icon={searchQuery ? Search : History}
            title={searchQuery ? "No results found" : "No request history"}
            description={
              searchQuery
                ? "Try adjusting your search query"
                : "Your request history will appear here after you send requests"
            }
            suggestions={
              searchQuery
                ? []
                : [
                    "Send a request to see it in history",
                    "History helps you quickly access recent requests",
                    "Use search to find specific requests",
                  ]
            }
          />
        ) : (
          <div className="space-y-1">
            {filteredHistory.map((item) => (
              <div
                key={item.id}
                className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer group"
                onClick={() => handleOpenInNewTab(item)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span
                      className={`px-2 py-0.5 text-xs font-semibold rounded ${
                        item.method === "GET"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          : item.method === "POST"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : item.method === "PUT"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          : item.method === "DELETE"
                          ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                      }`}
                    >
                      {item.method}
                    </span>
                    <span className="text-xs text-gray-700 dark:text-gray-300 truncate flex-1">
                      {item.url}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromHistory(item.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 ml-2"
                  >
                    ×
                  </button>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {item.status && (
                    <span
                      className={
                        item.status >= 200 && item.status < 300
                          ? "text-green-600 dark:text-green-400"
                          : item.status >= 400
                          ? "text-red-600 dark:text-red-400"
                          : "text-yellow-600 dark:text-yellow-400"
                      }
                    >
                      {item.status}
                    </span>
                  )}
                  {item.duration && <span>{item.duration}ms</span>}
                  <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

