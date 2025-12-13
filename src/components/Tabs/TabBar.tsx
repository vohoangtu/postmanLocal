import { useTabStore } from "../../stores/tabStore";

export default function TabBar() {
  const { tabs, activeTabId, setActiveTab, closeTab } = useTabStore();

  if (tabs.length === 0) return null;

  return (
    <div className="flex items-center bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`flex items-center gap-2 px-4 py-2 border-r border-gray-200 dark:border-gray-700 cursor-pointer min-w-[200px] ${
            activeTabId === tab.id
              ? "bg-white dark:bg-gray-900 border-b-2 border-blue-600"
              : "bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
          onClick={() => setActiveTab(tab.id)}
        >
          <span
            className={`text-xs font-semibold ${
              tab.method === "GET"
                ? "text-blue-600 dark:text-blue-400"
                : tab.method === "POST"
                ? "text-green-600 dark:text-green-400"
                : tab.method === "PUT"
                ? "text-yellow-600 dark:text-yellow-400"
                : tab.method === "DELETE"
                ? "text-red-600 dark:text-red-400"
                : "text-gray-600 dark:text-gray-400"
            }`}
          >
            {tab.method}
          </span>
          <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">
            {tab.name}
          </span>
          {tab.isDirty && (
            <span className="w-2 h-2 bg-orange-500 rounded-full" title="Unsaved changes" />
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              closeTab(tab.id);
            }}
            className="opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-600 rounded p-0.5"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

