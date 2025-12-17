/**
 * Main App Component
 * Component chính cho PostmanLocal API testing app
 */

import { lazy, Suspense, memo, useMemo, useCallback, useEffect } from "react";
import ErrorBoundary from "./Error/ErrorBoundary";
import ToastContainer from "./Toast/ToastContainer";
import LeftPanel from "./Panels/PublicLeftPanel";
import PanelManager from "./Panels/PanelManager";
import TabBar from "./Tabs/TabBar";
import EmptyState from "./EmptyStates/EmptyState";
import TabButton from "./UI/TabButton";
import MainContentView from "./MainContentView";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { useTabStore } from "../stores/tabStore";
import { usePanelStore } from "../stores/panelStore";
import { useOnboardingStore } from "../stores/onboardingStore";
import { useNavigation } from "../contexts/NavigationContext";
import { IS_TAURI } from "../utils/platform";
import { FileText, Loader2, LogIn } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import OnboardingFlow from "./Onboarding/OnboardingFlow";
import { layoutStyles } from "../utils/layoutStyles";
import { cn } from "../utils/cn";

// Lazy load các components lớn
const CommandPalette = lazy(() => import("./CommandPalette/CommandPalette"));
const RequestBuilder = lazy(() => import("./RequestBuilder/PublicRequestBuilder"));
const ResponseViewer = lazy(() => import("./ResponseViewer/PublicResponseViewer"));
const TestEditor = lazy(() => import("./TestRunner/PublicTestEditor"));
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
    setLeftPanelView,
    setActiveViewTab,
    setCommandPaletteOpen,
  } = usePanelStore();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { loadOnboardingStatus, hasCompletedOnboarding } = useOnboardingStore();
  const { activeView, setActiveView, registerCallbacks } = useNavigation();

  const activeTab = useMemo(
    () => activeTabId ? tabs.find((t) => t.id === activeTabId) : null,
    [tabs, activeTabId]
  );
  const activeResponse = useMemo(() => activeTab?.response, [activeTab?.response]);

  const handleNewRequestInternal = useCallback(() => {
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

  const handleViewChangeInternal = useCallback((view: Parameters<typeof toggleLeftPanel>[0]) => {
    if (view !== undefined && view !== null) {
      // Cast PanelView to NavigationView (chúng có cùng giá trị)
      setActiveView(view as "collections" | "history" | "templates" | "environments" | "schema" | "mock" | "docs" | "workspaces" | "chains" | null);
      
      // Các chức năng chính (Collections, Chains, Mock Server) hiển thị trong main content
      // Chỉ mở LeftPanel cho các tools nhỏ (History, Templates, Environments)
      if (view === "collections" || view === "chains" || view === "mock") {
        // Cập nhật leftPanelView để MainContentView biết view nào đang active
        // Nhưng không mở LeftPanel
        setLeftPanelView(view);
        closeLeftPanel();
      } else {
        // Các tools nhỏ mở trong LeftPanel như bình thường
        toggleLeftPanel(view);
      }
    }
  }, [toggleLeftPanel, setActiveView, setLeftPanelView, closeLeftPanel]);

  // Register callbacks với NavigationContext
  useEffect(() => {
    registerCallbacks({
      onNewRequest: handleNewRequestInternal,
      onViewChange: handleViewChangeInternal,
    });
  }, [registerCallbacks, handleNewRequestInternal, handleViewChangeInternal]);

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

  // Sync activeView với leftPanelView
  useEffect(() => {
    if (leftPanelView !== activeView) {
      // Cast PanelView to NavigationView (chúng có cùng giá trị)
      setActiveView(leftPanelView as "collections" | "history" | "templates" | "environments" | "schema" | "mock" | "docs" | "workspaces" | "chains" | null);
    }
  }, [leftPanelView, activeView, setActiveView]);

  // Load onboarding status khi component mount và khi user đăng nhập
  useEffect(() => {
    if (isAuthenticated) {
      loadOnboardingStatus();
    }
  }, [isAuthenticated, loadOnboardingStatus]);

  // Render left panel nếu cần
  const renderLeftPanel = () => {
    if (!isLeftPanelOpen || !leftPanelView) return null;
    
    const shouldShowPanel = 
      leftPanelView === "history" || 
      leftPanelView === "templates" || 
      leftPanelView === "environments" || 
      activeTab;

    if (!shouldShowPanel) return null;

    return (
      <>
        <div className="hidden md:block w-80 lg:w-96 flex-shrink-0">
          <LeftPanel
            view={leftPanelView}
            isOpen={isLeftPanelOpen}
            onClose={closeLeftPanel}
            onNewRequest={handleNewRequestInternal}
          />
        </div>
        <div className="md:hidden">
          <LeftPanel
            view={leftPanelView}
            isOpen={isLeftPanelOpen}
            onClose={closeLeftPanel}
            onNewRequest={handleNewRequestInternal}
          />
        </div>
      </>
    );
  };

  // Render main content
  const renderMainContent = () => {
    if (activeTab) {
      return (
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
      );
    }

    if (!isAuthenticated) {
      return (
        <div className={layoutStyles.emptyStateContainer}>
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
        </div>
      );
    }

    if (leftPanelView && (leftPanelView === "collections" || leftPanelView === "chains" || leftPanelView === "mock")) {
      return <MainContentView view={leftPanelView} />;
    }

    return (
      <div className={layoutStyles.emptyStateContainer}>
        <EmptyState
          icon={FileText}
          title="No request open"
          description="Create a new request to get started testing APIs"
          action={{
            label: "New Request",
            onClick: handleNewRequestInternal,
          }}
          suggestions={[
            "Use templates to quickly start",
            "Import from Postman collection",
            "Browse request history",
          ]}
        />
      </div>
    );
  };

  return (
    <ErrorBoundary>
      <PanelManager>
        <div className={layoutStyles.container}>
          <ToastContainer />
          <Suspense fallback={null}>
            <CommandPalette
              isOpen={isCommandPaletteOpen}
              onClose={() => setCommandPaletteOpen(false)}
              onNewRequest={handleNewRequestInternal}
            />
          </Suspense>
          
          {/* Onboarding Flow - chỉ hiển thị khi đã đăng nhập và chưa hoàn thành onboarding */}
          {isAuthenticated && !hasCompletedOnboarding() && (
            <OnboardingFlow />
          )}

          {/* Main Content Area */}
          <div className={layoutStyles.contentArea}>
            {/* Left Panel - chỉ hiển thị cho các tools nhỏ (History, Templates, Environments) hoặc khi có Request Builder active */}
            {renderLeftPanel()}

            {/* Divider giữa Left Panel và Main Content - chỉ hiển thị trên desktop */}
            {isLeftPanelOpen && leftPanelView !== null && 
             (leftPanelView === "history" || leftPanelView === "templates" || leftPanelView === "environments" || activeTab) && (
              <div className={cn(layoutStyles.divider, 'hidden md:block')} />
            )}

            <div className={layoutStyles.mainContent}>
              {activeTab && <TabBar />}
              <div className="flex-1 flex min-w-0">
                <div className="flex-1 flex flex-col min-w-0 h-full">
                  {renderMainContent()}
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
