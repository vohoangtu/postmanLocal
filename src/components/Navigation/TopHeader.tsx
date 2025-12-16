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

  // Kiểm tra theme hiện tại
  useEffect(() => {
    const checkTheme = () => {
      const root = document.documentElement;
      setIsDark(root.classList.contains('dark'));
    };
    
    checkTheme();
    
    // Listen for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, [preferences.theme]);

  // Toggle theme giữa light và dark
  const handleToggleTheme = async () => {
    const newTheme = isDark ? 'light' : 'dark';
    
    // Cập nhật preferences trong store ngay lập tức (local) và apply theme
    setPreferencesLocal({ theme: newTheme });
    
    // Thử lưu vào backend nếu đã đăng nhập (không block UI)
    try {
      await updatePreferences({ theme: newTheme });
    } catch (error) {
      // Nếu chưa đăng nhập hoặc lỗi, theme vẫn đã được apply locally
      console.log('Theme updated locally (user may not be logged in)');
    }
  };

  const navItems = [
    {
      id: "collections",
      icon: Folder,
      label: "Collections",
      view: "collections" as const,
      feature: "collections" as const,
    },
    {
      id: "history",
      icon: History,
      label: "History",
      view: "history" as const,
      feature: "view_history" as const,
    },
    {
      id: "templates",
      icon: FileCode,
      label: "Templates",
      view: "templates" as const,
      feature: "templates" as const,
    },
    {
      id: "environments",
      icon: Settings,
      label: "Environments",
      view: "environments" as const,
      feature: "environments" as const,
    },
    {
      id: "schema",
      icon: BookOpen,
      label: "Schema",
      view: "schema" as const,
      feature: "view_history" as const, // Schema luôn available
    },
    {
      id: "mock",
      icon: Server,
      label: "Mock Server",
      view: "mock" as const,
      feature: "mock_server" as const,
    },
    {
      id: "workspaces",
      icon: Users,
      label: "Workspaces",
      view: "workspaces" as const,
      feature: "view_history" as const, // Workspaces luôn available
    },
    {
      id: "chains",
      icon: Link2,
      label: "Chains",
      view: "chains" as const,
      feature: "request_chaining" as const,
    },
  ];

  return (
    <div className="h-14 bg-gray-900 dark:bg-gray-950 border-b border-gray-800 dark:border-gray-800 flex items-center px-4 space-x-2">
      {/* Logo/Brand */}
      <div className="flex items-center space-x-3 mr-4">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xs hover:bg-blue-700 transition-colors cursor-pointer" title="PostmanLocal">
          PL
        </div>
        <span className="text-white font-semibold text-sm hidden sm:block">PostmanLocal</span>
      </div>

      {/* New Request Button */}
      <Button
        variant="primary"
        size="sm"
        onClick={onNewRequest}
        disabled={!isAuthenticated}
        className="flex items-center gap-2"
        title={!isAuthenticated ? "Vui lòng đăng nhập để tạo request" : "Tạo request mới"}
        data-onboarding="new-request-button"
      >
        <FileText size={16} />
        <span className="hidden sm:inline">New Request</span>
      </Button>

      <div className="h-6 w-px bg-gray-700 mx-2" />

      {/* Navigation Items */}
      <div className="flex items-center space-x-1 flex-1 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.view;

          const button = (
            <button
              key={item.id}
              onClick={() => item.view && onViewChange(item.view)}
              className={`relative flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg transition-all duration-200 whitespace-nowrap group ${
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/50"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
              title={item.label}
              aria-label={item.label}
            >
              <Icon size={18} className={isActive ? "scale-110" : "group-hover:scale-110 transition-transform"} />
              <span className="text-sm hidden lg:inline font-medium">{item.label}</span>
              {isActive && (
                <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full" />
              )}
            </button>
          );

          // Wrap với FeatureGate nếu tính năng yêu cầu onboarding
          return (
            <FeatureGate
              key={item.id}
              feature={item.feature}
              showMessage={false}
              fallback={
                <button
                  className="relative flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg transition-all duration-200 whitespace-nowrap text-gray-500 cursor-not-allowed opacity-50"
                  title={`${item.label} - Cần hoàn thành hướng dẫn`}
                  aria-label={`${item.label} - Cần hoàn thành hướng dẫn`}
                  disabled
                >
                  <Icon size={18} />
                  <span className="text-sm hidden lg:inline font-medium">{item.label}</span>
                </button>
              }
            >
              {button}
            </FeatureGate>
          );
        })}
      </div>

      <div className="h-6 w-px bg-gray-700 mx-2" />

      {/* Theme Toggle Button */}
      <button
        onClick={handleToggleTheme}
        className="relative p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800"
        title={isDark ? "Chuyển sang Light mode" : "Chuyển sang Dark mode"}
        aria-label={isDark ? "Chuyển sang Light mode" : "Chuyển sang Dark mode"}
      >
        {isDark ? (
          <Sun size={20} className="text-yellow-400" />
        ) : (
          <Moon size={20} />
        )}
      </button>

      {/* Notification Center */}
      <NotificationCenter />
    </div>
  );
}

