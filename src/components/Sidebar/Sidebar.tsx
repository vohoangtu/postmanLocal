import { useState } from "react";
import CollectionManager from "../Collections/CollectionManager";
import EnvironmentManager from "../Environment/EnvironmentManager";
import RequestHistory from "../RequestHistory/RequestHistory";
import RequestTemplates from "../Templates/RequestTemplates";
import ImportExport from "../ImportExport/ImportExport";
import Button from "../UI/Button";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Folder,
  History,
  FileCode,
  Server,
  BookOpen,
  Download,
  Upload,
} from "lucide-react";

interface SidebarProps {
  view: "collections" | "history" | "templates";
  onViewChange: (view: "collections" | "history" | "templates") => void;
  onNewRequest: () => void;
}

export default function Sidebar({ view, onViewChange, onNewRequest }: SidebarProps) {
  const [activeTab, setActiveTab] = useState<"collections" | "environments">("collections");
  const [isCollapsed, setIsCollapsed] = useState(false);

  const sidebarWidth = isCollapsed ? "w-16" : "w-80";

  return (
    <div className={`${sidebarWidth} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 relative`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        {!isCollapsed && (
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-3">PostmanLocal</h1>
        )}
        <Button
          variant="primary"
          size={isCollapsed ? "sm" : "md"}
          onClick={onNewRequest}
          className="w-full"
        >
          {isCollapsed ? <FileText size={18} /> : "+ New Request"}
        </Button>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute top-4 -right-3 p-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-10 shadow-md"
        title={isCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
      >
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
      
      {/* Navigation Tabs */}
      {!isCollapsed && (
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => {
              onViewChange("collections");
              setActiveTab("collections");
            }}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              view === "collections"
                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            Collections
          </button>
          <button
            onClick={() => {
              onViewChange("history");
            }}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              view === "history"
                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            History
          </button>
          <button
            onClick={() => {
              onViewChange("templates");
            }}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              view === "templates"
                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            Templates
          </button>
        </div>
      )}

      {/* Collapsed Navigation Icons */}
      {isCollapsed && (
        <div className="flex flex-col border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => {
              onViewChange("collections");
              setActiveTab("collections");
            }}
            className={`p-3 text-sm font-medium transition-colors ${
              view === "collections"
                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
            title="Collections"
          >
            <Folder size={20} className="mx-auto" />
          </button>
          <button
            onClick={() => {
              onViewChange("history");
            }}
            className={`p-3 text-sm font-medium transition-colors ${
              view === "history"
                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
            title="History"
          >
            <History size={20} className="mx-auto" />
          </button>
          <button
            onClick={() => {
              onViewChange("templates");
            }}
            className={`p-3 text-sm font-medium transition-colors ${
              view === "templates"
                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
            title="Templates"
          >
            <FileCode size={20} className="mx-auto" />
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {!isCollapsed && (
          <>
            {view === "collections" && (
              <>
                <div className="flex border-b border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setActiveTab("collections")}
                    className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                      activeTab === "collections"
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    Collections
                  </button>
                  <button
                    onClick={() => setActiveTab("environments")}
                    className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                      activeTab === "environments"
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    Environments
                  </button>
                </div>
                <div className="p-4">
                  {activeTab === "collections" ? (
                    <>
                      <CollectionManager />
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <ImportExport />
                      </div>
                    </>
                  ) : (
                    <EnvironmentManager />
                  )}
                </div>
              </>
            )}
            {view === "history" && <RequestHistory />}
            {view === "templates" && <RequestTemplates />}
          </>
        )}
      </div>
    </div>
  );
}
