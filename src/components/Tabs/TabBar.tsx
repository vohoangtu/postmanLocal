import { useTabStore } from "../../stores/tabStore";
import { X } from "lucide-react";
import Tooltip from "../UI/Tooltip";

export default function TabBar() {
  const { tabs, activeTabId, setActiveTab, closeTab } = useTabStore();

  if (tabs.length === 0) return null;

  return (
    <div className="flex items-center bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`group flex items-center gap-2 px-3 py-2 border-r border-gray-200 dark:border-gray-700 cursor-pointer min-w-[180px] max-w-[250px] transition-colors ${
            activeTabId === tab.id
              ? "bg-white dark:bg-gray-900 border-b-2 border-blue-600"
              : "bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
          onClick={() => setActiveTab(tab.id)}
        >
          <span
            className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
              tab.method === "GET"
                ? "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30"
                : tab.method === "POST"
                ? "text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30"
                : tab.method === "PUT"
                ? "text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30"
                : tab.method === "DELETE"
                ? "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30"
                : tab.method === "PATCH"
                ? "text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30"
                : "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700"
            }`}
          >
            {tab.method}
          </span>
          <span className="flex-1 text-xs text-gray-700 dark:text-gray-300 truncate font-medium">
            {tab.name}
          </span>
          {tab.isDirty && (
            <Tooltip content="Unsaved changes">
              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full flex-shrink-0" />
            </Tooltip>
          )}
          <Tooltip content="Close tab (Ctrl+W)">
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.id);
              }}
              className="opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-600 rounded p-0.5 transition-opacity flex-shrink-0"
            >
              <X size={14} className="text-gray-500 dark:text-gray-400" />
            </button>
          </Tooltip>
        </div>
      ))}
    </div>
  );
}

