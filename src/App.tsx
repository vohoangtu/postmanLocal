import { lazy, Suspense, memo, useMemo, useCallback } from "react";
import ErrorBoundary from "./components/Error/ErrorBoundary";
import ToastContainer from "./components/Toast/ToastContainer";
import TopHeader from "./components/Navigation/TopHeader";
import LeftPanel from "./components/Panels/LeftPanel";
import TabBar from "./components/Tabs/TabBar";
import EmptyState from "./components/EmptyStates/EmptyState";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useTabStore } from "./stores/tabStore";
import { usePanelStore } from "./stores/panelStore";
import { IS_TAURI } from "./utils/platform";
import { FileText, Loader2 } from "lucide-react";

// Lazy load các components lớn
const CommandPalette = lazy(() => import("./components/CommandPalette/CommandPalette"));
const RequestBuilder = lazy(() => import("./components/RequestBuilder/RequestBuilder"));
const ResponseViewer = lazy(() => import("./components/ResponseViewer/ResponseViewer"));
const TestEditor = lazy(() => import("./components/TestRunner/TestEditor"));
const SyncPanel = lazy(() => import("./components/Sync/SyncPanel"));

function App() {
  const { tabs, activeTabId, addTab } = useTabStore();
  const {
    leftPanelView,
    isLeftPanelOpen,
    activeViewTab,
    isCommandPaletteOpen,
    toggleLeftPanel,
    closeLeftPanel,
    setActiveViewTab,
    setCommandPaletteOpen,
  } = usePanelStore();

  const activeTab = useMemo(
    () => activeTabId ? tabs.find((t) => t.id === activeTabId) : null,
    [tabs, activeTabId]
  );
  const activeResponse = useMemo(() => activeTab?.response, [activeTab?.response]);

  const handleNewRequest = useCallback(() => {
    addTab({
      name: "New Request",
      method: "GET",
      url: "",
    });
  }, [addTab]);

  useKeyboardShortcuts([
    {
      key: "k",
      ctrl: true,
      handler: () => setCommandPaletteOpen(true),
      description: "Open command palette",
    },
    {
      key: "b",
      ctrl: true,
      handler: () => toggleLeftPanel(),
      description: "Toggle left panel",
    },
    {
      key: "Escape",
      handler: () => {
        if (isCommandPaletteOpen) {
          setCommandPaletteOpen(false);
        } else if (isLeftPanelOpen) {
          closeLeftPanel();
        }
      },
      description: "Close active panel",
    },
  ]);

  const handleViewChange = useCallback((view: Parameters<typeof toggleLeftPanel>[0]) => {
    toggleLeftPanel(view);
  }, [toggleLeftPanel]);

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
        <ToastContainer />
        <Suspense fallback={null}>
          <CommandPalette
            isOpen={isCommandPaletteOpen}
            onClose={() => setCommandPaletteOpen(false)}
            onNewRequest={handleNewRequest}
          />
        </Suspense>
        
        {/* Top Header - Navigation */}
        <TopHeader
          activeView={leftPanelView}
          onViewChange={handleViewChange}
          onNewRequest={handleNewRequest}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex min-w-0 overflow-hidden relative">
          {/* Left Panel - hiển thị khi có view được chọn */}
          {isLeftPanelOpen && leftPanelView !== null && (
            <div 
              className={`hidden md:block transition-all duration-300 ease-in-out ${
                isLeftPanelOpen 
                  ? 'w-[40%] min-w-[320px] opacity-100' 
                  : 'w-0 opacity-0'
              }`}
            >
              <LeftPanel
                view={leftPanelView}
                isOpen={isLeftPanelOpen}
                onClose={closeLeftPanel}
                onNewRequest={handleNewRequest}
              />
            </div>
          )}

          {/* Divider giữa Left Panel và Main Content */}
          {isLeftPanelOpen && leftPanelView !== null && (
            <div className="hidden md:block w-px bg-gray-200 dark:bg-gray-700" />
          )}

          <div 
            className={`flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300 ease-in-out ${
              isLeftPanelOpen && leftPanelView !== null 
                ? 'w-[60%]' 
                : 'w-full'
            }`}
          >
            <TabBar />
            <div className="flex-1 flex overflow-hidden">
              <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {activeTab ? (
                  <>
                    <Suspense fallback={
                      <div className="flex-1 flex items-center justify-center">
                        <Loader2 className="animate-spin text-blue-600" size={32} />
                      </div>
                    }>
                      <RequestBuilder 
                        requestId={null}
                        onResponse={() => {
                          // Response is handled in RequestBuilder via tab store
                        }}
                        tabId={activeTab.id}
                      />
                    </Suspense>
                    <div className="h-64 border-t border-gray-200 dark:border-gray-700 flex flex-col">
                      <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                        <button
                          onClick={() => setActiveViewTab("response")}
                          className={`flex-1 h-10 px-4 text-sm font-medium transition-colors relative flex items-center justify-center ${
                            activeViewTab === "response"
                              ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                          }`}
                        >
                          <span>Response</span>
                          {activeViewTab === "response" && (
                            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                          )}
                        </button>
                        <button
                          onClick={() => setActiveViewTab("tests")}
                          className={`flex-1 h-10 px-4 text-sm font-medium transition-colors relative flex items-center justify-center ${
                            activeViewTab === "tests"
                              ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                          }`}
                        >
                          <span>Tests</span>
                          {activeViewTab === "tests" && (
                            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                          )}
                        </button>
                      </div>
                      <div className="flex-1 overflow-auto">
                        <Suspense fallback={
                          <div className="flex items-center justify-center h-full">
                            <Loader2 className="animate-spin text-blue-600" />
                          </div>
                        }>
                          {activeViewTab === "response" ? (
                            <ResponseViewer 
                              response={activeResponse} 
                              responseTime={activeTab.response?.duration}
                            />
                          ) : (
                            <TestEditor response={activeResponse} onTestResults={() => {}} />
                          )}
                        </Suspense>
                      </div>
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
        {IS_TAURI && (
          <Suspense fallback={null}>
            <SyncPanel />
          </Suspense>
        )}
      </div>
    </ErrorBoundary>
  );
}

export default memo(App);
