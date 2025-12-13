import { useState } from "react";
import ErrorBoundary from "./components/Error/ErrorBoundary";
import ToastContainer from "./components/Toast/ToastContainer";
import CommandPalette from "./components/CommandPalette/CommandPalette";
import TopHeader from "./components/Navigation/TopHeader";
import LeftPanel from "./components/Panels/LeftPanel";
import RequestBuilder from "./components/RequestBuilder/RequestBuilder";
import ResponseViewer from "./components/ResponseViewer/ResponseViewer";
import TestEditor from "./components/TestRunner/TestEditor";
import SyncPanel from "./components/Sync/SyncPanel";
import TabBar from "./components/Tabs/TabBar";
import EmptyState from "./components/EmptyStates/EmptyState";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useTabStore } from "./stores/tabStore";
import { IS_TAURI } from "./utils/platform";
import { FileText } from "lucide-react";

function App() {
  const { tabs, activeTabId, addTab } = useTabStore();
  const [activeViewTab, setActiveViewTab] = useState<"response" | "tests">("response");
  const [leftPanelView, setLeftPanelView] = useState<"collections" | "history" | "templates" | "environments" | "schema" | "mock" | "docs" | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  const activeTab = activeTabId ? tabs.find((t) => t.id === activeTabId) : null;
  const activeResponse = activeTab?.response;

  const handleNewRequest = () => {
    addTab({
      name: "New Request",
      method: "GET",
      url: "",
    });
  };

  useKeyboardShortcuts([
    {
      key: "k",
      ctrl: true,
      handler: () => setIsCommandPaletteOpen(true),
      description: "Open command palette",
    },
    {
      key: "b",
      ctrl: true,
      handler: () => setLeftPanelView(leftPanelView ? null : "collections"),
      description: "Toggle left panel",
    },
  ]);

  const handleViewChange = (view: "collections" | "history" | "templates" | "environments" | "schema" | "mock" | "docs" | null) => {
    // Nếu click vào view đang active, đóng panel
    if (leftPanelView === view) {
      setLeftPanelView(null);
    } else {
      setLeftPanelView(view);
    }
  };

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
        <ToastContainer />
        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          onNewRequest={handleNewRequest}
        />
        
        {/* Top Header - Navigation */}
        <TopHeader
          activeView={leftPanelView}
          onViewChange={handleViewChange}
          onNewRequest={handleNewRequest}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex min-w-0 overflow-hidden">
          {/* Left Panel - hiển thị khi có view được chọn */}
          {leftPanelView !== null && (
            <div className="hidden md:block w-[40%] min-w-[320px]">
              <LeftPanel
                view={leftPanelView}
                isOpen={true}
                onClose={() => setLeftPanelView(null)}
                onNewRequest={handleNewRequest}
              />
            </div>
          )}

          <div className={`flex-1 flex flex-col min-w-0 overflow-hidden ${leftPanelView !== null ? 'w-[60%]' : 'w-full'}`}>
            <TabBar />
            <div className="flex-1 flex overflow-hidden">
              <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {activeTab ? (
                  <>
                    <RequestBuilder 
                      requestId={null}
                      onResponse={() => {
                        // Response is handled in RequestBuilder via tab store
                      }}
                      tabId={activeTab.id}
                    />
                    <div className="h-64 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex border-b border-gray-200 dark:border-gray-700">
                        <button
                          onClick={() => setActiveViewTab("response")}
                          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                            activeViewTab === "response"
                              ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600"
                              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                          }`}
                        >
                          Response
                        </button>
                        <button
                          onClick={() => setActiveViewTab("tests")}
                          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                            activeViewTab === "tests"
                              ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600"
                              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                          }`}
                        >
                          Tests
                        </button>
                      </div>
                      {activeViewTab === "response" ? (
                        <ResponseViewer 
                          response={activeResponse} 
                          responseTime={activeTab.response?.duration}
                        />
                      ) : (
                        <TestEditor response={activeResponse} onTestResults={() => {}} />
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-800">
                    <EmptyState
                      icon={FileText}
                      title="No request open"
                      description="Create a new request to get started testing APIs"
                      action={{
                        label: "New Request",
                        onClick: handleNewRequest,
                      }}
                      suggestions={[
                        "Use templates to quickly start",
                        "Import from Postman collection",
                        "Browse request history",
                      ]}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Sync Panel chỉ hiển thị trên Desktop (Tauri) */}
        {IS_TAURI && <SyncPanel />}
      </div>
    </ErrorBoundary>
  );
}

export default App;
