/**
 * Main App Component
 * Component chính cho PostmanLocal API testing app
 */

import { lazy, Suspense, memo, useMemo, useCallback, useEffect } from "react";
import ErrorBoundary from "./Error/ErrorBoundary";
import ToastContainer from "./Toast/ToastContainer";
import TopHeader from "./Navigation/TopHeader";
import LeftPanel from "./Panels/LeftPanel";
import PanelManager from "./Panels/PanelManager";
import TabBar from "./Tabs/TabBar";
import EmptyState from "./EmptyStates/EmptyState";
import TabButton from "./UI/TabButton";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { useTabStore } from "../stores/tabStore";
import { usePanelStore } from "../stores/panelStore";
import { useOnboardingStore } from "../stores/onboardingStore";
import { IS_TAURI } from "../utils/platform";
import { FileText, Loader2, User, Shield, LogIn } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import OnboardingFlow from "./Onboarding/OnboardingFlow";

// Lazy load các components lớn
const CommandPalette = lazy(() => import("./CommandPalette/CommandPalette"));
const RequestBuilder = lazy(() => import("./RequestBuilder/RequestBuilder"));
const ResponseViewer = lazy(() => import("./ResponseViewer/ResponseViewer"));
const TestEditor = lazy(() => import("./TestRunner/TestEditor"));
const SyncPanel = lazy(() => import("./Sync/SyncPanel"));

function MainApp() {
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
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { loadOnboardingStatus, hasCompletedOnboarding } = useOnboardingStore();

  const activeTab = useMemo(
    () => activeTabId ? tabs.find((t) => t.id === activeTabId) : null,
    [tabs, activeTabId]
  );
  const activeResponse = useMemo(() => activeTab?.response, [activeTab?.response]);

  const handleNewRequest = useCallback(() => {
    // Yêu cầu đăng nhập trước khi tạo request
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    addTab({
      name: "New Request",
      method: "GET",
      url: "",
    });
  }, [addTab, isAuthenticated, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

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

  // Load onboarding status khi component mount và khi user đăng nhập
  useEffect(() => {
    if (isAuthenticated) {
      loadOnboardingStatus();
    }
  }, [isAuthenticated, loadOnboardingStatus]);

  return (
    <ErrorBoundary>
      <PanelManager>
        <div className="flex flex-col h-screen bg-white dark:bg-gray-900 overflow-hidden">
        <ToastContainer />
        <Suspense fallback={null}>
          <CommandPalette
            isOpen={isCommandPaletteOpen}
            onClose={() => setCommandPaletteOpen(false)}
            onNewRequest={handleNewRequest}
          />
        </Suspense>
        
        {/* Onboarding Flow - chỉ hiển thị khi đã đăng nhập và chưa hoàn thành onboarding */}
        {isAuthenticated && !hasCompletedOnboarding() && (
          <OnboardingFlow />
        )}
        
        {/* Top Header - Navigation với user menu */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <TopHeader
            activeView={leftPanelView}
            onViewChange={handleViewChange}
            onNewRequest={handleNewRequest}
            isAuthenticated={isAuthenticated}
          />
          {/* User menu bar */}
          <div className="px-4 py-2 bg-white dark:bg-gray-800 border-t-2 border-gray-300 dark:border-gray-700 flex items-center justify-between shadow-md">
            {user ? (
              <>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-800 dark:text-gray-200 font-medium">
                    {user.name} ({user.email})
                  </span>
                  {(user.role === 'admin' || user.role === 'super_admin') && (
                    <button
                      onClick={() => navigate('/admin/dashboard')}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-md font-medium border border-blue-300 dark:border-blue-700 shadow-sm"
                    >
                      <Shield size={16} />
                      Admin Panel
                    </button>
                  )}
                  <button
                    onClick={() => navigate('/user')}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md font-medium border border-gray-300 dark:border-gray-600"
                  >
                    <User size={16} />
                    Settings
                  </button>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md font-medium border border-gray-300 dark:border-gray-600"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Local Mode - Chưa đăng nhập
                </span>
                <button
                  onClick={() => navigate('/login')}
                  className="flex items-center gap-2 px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                >
                  <LogIn size={16} />
                  Đăng nhập
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex min-w-0 overflow-hidden relative">
          {/* Left Panel - hiển thị khi có view được chọn */}
          {isLeftPanelOpen && leftPanelView !== null && (
            <>
              <div className="hidden md:block w-80 lg:w-96 flex-shrink-0">
                <LeftPanel
                  view={leftPanelView}
                  isOpen={isLeftPanelOpen}
                  onClose={closeLeftPanel}
                  onNewRequest={handleNewRequest}
                />
              </div>
              {/* Mobile panel - luôn render nhưng ẩn trên desktop */}
              <div className="md:hidden">
                <LeftPanel
                  view={leftPanelView}
                  isOpen={isLeftPanelOpen}
                  onClose={closeLeftPanel}
                  onNewRequest={handleNewRequest}
                />
              </div>
            </>
          )}

          {/* Divider giữa Left Panel và Main Content - chỉ hiển thị trên desktop */}
          {isLeftPanelOpen && leftPanelView !== null && (
            <div className="hidden md:block w-px bg-gray-300 dark:bg-gray-700 flex-shrink-0" />
          )}

          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
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
                        <TabButton
                          active={activeViewTab === "response"}
                          onClick={() => setActiveViewTab("response")}
                          className="flex-1"
                        >
                          Response
                        </TabButton>
                        <TabButton
                          active={activeViewTab === "tests"}
                          onClick={() => setActiveViewTab("tests")}
                          className="flex-1"
                        >
                          Tests
                        </TabButton>
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
                    {!isAuthenticated ? (
                      <EmptyState
                        icon={LogIn}
                        title="Vui lòng đăng nhập"
                        description="Bạn cần đăng nhập để sử dụng PostmanLocal và tạo các request API"
                        action={{
                          label: "Đăng nhập",
                          onClick: () => navigate('/login'),
                        }}
                        suggestions={[
                          "Đăng nhập để lưu và quản lý requests",
                          "Đồng bộ dữ liệu giữa các thiết bị",
                          "Truy cập các tính năng nâng cao",
                        ]}
                      />
                    ) : (
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
                    )}
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
      </PanelManager>
    </ErrorBoundary>
  );
}

export default memo(MainApp);
