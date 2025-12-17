/**
 * Top Header - Navigation bar ở trên cùng
 * Hiển thị icons và actions ngang
 */

import { FileText, Folder, History, FileCode, Settings, Server, BookOpen, Users, Link2, Sun, Moon } from "lucide-react";
import Button from "../UI/Button";
import NotificationCenter from "../Notifications/NotificationCenter";
import FeatureGate from "../FeatureGate/FeatureGate";
import { useUserPreferencesStore } from "../../stores/userPreferencesStore";
import { useEffect, useState } from "react";

interface TopHeaderProps {
  activeView: "collections" | "history" | "templates" | "environments" | "schema" | "mock" | "docs" | "workspaces" | "chains" | null;
  onViewChange: (view: "collections" | "history" | "templates" | "environments" | "schema" | "mock" | "docs" | "workspaces" | "chains" | null) => void;
  onNewRequest: () => void;
  isAuthenticated?: boolean;
}

export default function TopHeader({
  activeView,
  onViewChange,
  onNewRequest,
  isAuthenticated = false,
}: TopHeaderProps) {
  const { preferences, updatePreferences, setPreferencesLocal } = useUserPreferencesStore();
  const [isDark, setIsDark] = useState(false);

  // Kiểm tra theme hiện tại và sync với preferences
  useEffect(() => {
    const checkTheme = () => {
      const root = document.documentElement;
      const isCurrentlyDark = root.classList.contains('dark');
      setIsDark(isCurrentlyDark);
    };
    
    // Kiểm tra theme ban đầu
    checkTheme();
    
    // Listen cho changes từ DOM
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    // Listen cho storage events (sync giữa các tabs)
    const handleStorageChange = () => {
      checkTheme();
    };
    window.addEventListener('storage', handleStorageChange);
    
    // Sync với preferences store
    if (preferences.theme) {
      const root = document.documentElement;
      const shouldBeDark = preferences.theme === 'dark' || 
        (preferences.theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      
      if (shouldBeDark && !root.classList.contains('dark')) {
        root.classList.add('dark');
        setIsDark(true);
      } else if (!shouldBeDark && root.classList.contains('dark')) {
        root.classList.remove('dark');
        setIsDark(false);
      }
    }
    
    return () => {
      observer.disconnect();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [preferences.theme]);

  // Toggle theme giữa light và dark
  const handleToggleTheme = async () => {
    const newTheme = isDark ? 'light' : 'dark';
    
    // Cập nhật preferences trong store ngay lập tức (local) và apply theme
    setPreferencesLocal({ theme: newTheme });
    
    // Cập nhật state để UI phản ánh ngay
    setIsDark(newTheme === 'dark');
    
    // Thử lưu vào backend nếu đã đăng nhập (không block UI)
    try {
      await updatePreferences({ theme: newTheme });
    } catch (error) {
      // Nếu chưa đăng nhập hoặc lỗi, theme vẫn đã được apply locally
      console.log('Theme updated locally (user may not be logged in)');
    }
  };

  // Sắp xếp navigation theo nhóm chức năng
  const navItems = [
    // Core - Chức năng chính
    {
      id: "collections",
      icon: Folder,
      label: "Collections",
      view: "collections" as const,
      feature: "collections" as const,
      group: "core" as const,
    },
    {
      id: "history",
      icon: History,
      label: "History",
      view: "history" as const,
      feature: "view_history" as const,
      group: "core" as const,
    },
    // Tools - Công cụ hỗ trợ
    {
      id: "environments",
      icon: Settings,
      label: "Environments",
      view: "environments" as const,
      feature: "environments" as const,
      group: "tools" as const,
    },
    {
      id: "templates",
      icon: FileCode,
      label: "Templates",
      view: "templates" as const,
      feature: "templates" as const,
      group: "tools" as const,
    },
    {
      id: "schema",
      icon: BookOpen,
      label: "Schema",
      view: "schema" as const,
      feature: "view_history" as const,
      group: "tools" as const,
    },
    {
      id: "mock",
      icon: Server,
      label: "Mock Server",
      view: "mock" as const,
      feature: "mock_server" as const,
      group: "tools" as const,
    },
    // Collaboration - Cộng tác
    {
      id: "workspaces",
      icon: Users,
      label: "Workspaces",
      view: "workspaces" as const,
      feature: "view_history" as const,
      group: "collaboration" as const,
    },
    {
      id: "chains",
      icon: Link2,
      label: "Chains",
      view: "chains" as const,
      feature: "request_chaining" as const,
      group: "collaboration" as const,
    },
  ];

  // Nhóm navigation items
  const coreItems = navItems.filter(item => item.group === 'core');
  const toolsItems = navItems.filter(item => item.group === 'tools');
  const collaborationItems = navItems.filter(item => item.group === 'collaboration');

  return (
      <div className="h-14 bg-white dark:bg-gray-900 border-b-2 border-gray-300 dark:border-gray-700 shadow-md flex items-center px-4 space-x-3">
      {/* Logo/Brand */}
      <div className="flex items-center space-x-2.5 mr-2">
        <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center text-white font-bold text-sm hover:from-blue-700 hover:to-blue-800 transition-all cursor-pointer shadow-lg" title="PostmanLocal">
          PL
        </div>
        <span className="text-gray-900 dark:text-white font-bold text-sm hidden sm:block">PostmanLocal</span>
      </div>

      {/* New Request Button */}
      <Button
        variant="primary"
        size="sm"
        onClick={onNewRequest}
        disabled={!isAuthenticated}
        className="flex items-center gap-1.5 shadow-sm"
        title={!isAuthenticated ? "Vui lòng đăng nhập để tạo request" : "Tạo request mới"}
        data-onboarding="new-request-button"
      >
        <FileText size={16} />
        <span className="hidden sm:inline font-medium">New Request</span>
      </Button>

      <div className="h-6 w-px bg-gray-400 dark:bg-gray-600 mx-1" />

      {/* Navigation Items - Core */}
      <div className="flex items-center space-x-1">
        {coreItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.view;

          const button = (
            <button
              key={item.id}
              onClick={() => item.view && onViewChange(item.view)}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all duration-200 whitespace-nowrap group ${
                isActive
                  ? "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 font-semibold shadow-sm border border-blue-200 dark:border-blue-800"
                  : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 font-medium"
              }`}
              title={item.label}
              aria-label={item.label}
            >
              <Icon size={17} className={isActive ? "text-blue-700 dark:text-blue-300" : ""} />
              <span className="text-sm">{item.label}</span>
              {isActive && (
                <span className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-blue-600 dark:bg-blue-400 rounded-full shadow-sm" />
              )}
            </button>
          );

          return (
            <FeatureGate
              key={item.id}
              feature={item.feature}
              showMessage={false}
              fallback={
                <button
                  className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all duration-200 whitespace-nowrap text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50"
                  title={`${item.label} - Cần hoàn thành hướng dẫn`}
                  aria-label={`${item.label} - Cần hoàn thành hướng dẫn`}
                  disabled
                >
                  <Icon size={17} />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              }
            >
              {button}
            </FeatureGate>
          );
        })}
      </div>

      <div className="h-6 w-px bg-gray-400 dark:bg-gray-600 mx-1" />

      {/* Navigation Items - Tools */}
      <div className="flex items-center space-x-1 flex-1 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
        {toolsItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.view;

          const button = (
            <button
              key={item.id}
              onClick={() => item.view && onViewChange(item.view)}
              className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all duration-200 whitespace-nowrap group ${
                isActive
                  ? "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 font-semibold border border-blue-200 dark:border-blue-800"
                  : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 font-medium"
              }`}
              title={item.label}
              aria-label={item.label}
            >
              <Icon size={16} className={isActive ? "text-blue-700 dark:text-blue-300" : ""} />
              <span className="text-sm hidden lg:inline">{item.label}</span>
              {isActive && (
                <span className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-blue-600 dark:bg-blue-400 rounded-full shadow-sm" />
              )}
            </button>
          );

          return (
            <FeatureGate
              key={item.id}
              feature={item.feature}
              showMessage={false}
              fallback={
                <button
                  className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all duration-200 whitespace-nowrap text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50"
                  title={`${item.label} - Cần hoàn thành hướng dẫn`}
                  aria-label={`${item.label} - Cần hoàn thành hướng dẫn`}
                  disabled
                >
                  <Icon size={16} />
                  <span className="text-sm font-medium hidden lg:inline">{item.label}</span>
                </button>
              }
            >
              {button}
            </FeatureGate>
          );
        })}

        {/* Collaboration Items */}
        {collaborationItems.length > 0 && (
          <>
            <div className="h-6 w-px bg-gray-400 dark:bg-gray-600 mx-1" />
            {collaborationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.view;

              const button = (
                <button
                  key={item.id}
                  onClick={() => item.view && onViewChange(item.view)}
                  className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all duration-200 whitespace-nowrap group ${
                    isActive
                      ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                  title={item.label}
                  aria-label={item.label}
                >
                  <Icon size={16} className={isActive ? "text-blue-600 dark:text-blue-400" : ""} />
                  <span className="text-sm font-medium hidden lg:inline">{item.label}</span>
                  {isActive && (
                    <span className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-5 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
                  )}
                </button>
              );

              return (
                <FeatureGate
                  key={item.id}
                  feature={item.feature}
                  showMessage={false}
                  fallback={
                    <button
                      className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all duration-200 whitespace-nowrap text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50"
                      title={`${item.label} - Cần hoàn thành hướng dẫn`}
                      aria-label={`${item.label} - Cần hoàn thành hướng dẫn`}
                      disabled
                    >
                      <Icon size={16} />
                      <span className="text-sm font-medium hidden lg:inline">{item.label}</span>
                    </button>
                  }
                >
                  {button}
                </FeatureGate>
              );
            })}
          </>
        )}
      </div>

      <div className="h-6 w-px bg-gray-400 dark:bg-gray-600 mx-1" />

      {/* Theme Toggle Button */}
      <button
        onClick={handleToggleTheme}
        className="relative p-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
        title={isDark ? "Chuyển sang Light mode" : "Chuyển sang Dark mode"}
        aria-label={isDark ? "Chuyển sang Light mode" : "Chuyển sang Dark mode"}
      >
        {isDark ? (
          <Sun size={20} className="text-yellow-600" />
        ) : (
          <Moon size={20} className="text-gray-700 dark:text-gray-300" />
        )}
      </button>

      {/* Notification Center */}
      <NotificationCenter />
    </div>
  );
}

