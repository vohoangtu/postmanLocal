/**
 * Navigation Sidebar - Chỉ để navigation, nhỏ gọn
 * Hiển thị icons cho các tính năng chính
 */

import { FileText, Folder, History, FileCode, Settings, Server, BookOpen } from "lucide-react";
import Button from "../UI/Button";

interface NavigationSidebarProps {
  activeView: "collections" | "history" | "templates" | "environments" | "schema" | "mock" | "docs" | null;
  onViewChange: (view: "collections" | "history" | "templates" | "environments" | "schema" | "mock" | "docs" | null) => void;
  onNewRequest: () => void;
}

export default function NavigationSidebar({
  activeView,
  onViewChange,
  onNewRequest,
}: NavigationSidebarProps) {
  const navItems = [
    {
      id: "new-request",
      icon: FileText,
      label: "New Request",
      onClick: onNewRequest,
      isAction: true,
    },
    {
      id: "collections",
      icon: Folder,
      label: "Collections",
      view: "collections" as const,
    },
    {
      id: "history",
      icon: History,
      label: "History",
      view: "history" as const,
    },
    {
      id: "templates",
      icon: FileCode,
      label: "Templates",
      view: "templates" as const,
    },
    {
      id: "environments",
      icon: Settings,
      label: "Environments",
      view: "environments" as const,
    },
    {
      id: "schema",
      icon: BookOpen,
      label: "Schema",
      view: "schema" as const,
    },
    {
      id: "mock",
      icon: Server,
      label: "Mock Server",
      view: "mock" as const,
    },
  ];

  return (
    <div className="w-16 bg-gray-900 dark:bg-gray-950 border-r border-gray-800 dark:border-gray-800 flex flex-col items-center py-4 space-y-2">
      {/* Logo/Brand */}
      <div className="mb-4">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
          PL
        </div>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 flex flex-col space-y-1 w-full px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.view;
          const isAction = item.isAction;

          if (isAction) {
            return (
              <button
                key={item.id}
                onClick={item.onClick}
                className="w-12 h-12 mx-auto flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                title={item.label}
              >
                <Icon size={20} />
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => item.view && onViewChange(item.view)}
              className={`w-12 h-12 mx-auto flex items-center justify-center rounded-lg transition-colors ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
              title={item.label}
            >
              <Icon size={20} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

