/**
 * Left Panel - Hiển thị Collections, History, Templates, etc.
 * Có thể toggle mở/đóng
 */

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import CollectionManager from "../Collections/CollectionManager";
import EnvironmentManager from "../Environment/EnvironmentManager";
import RequestHistory from "../RequestHistory/RequestHistory";
import RequestTemplates from "../Templates/RequestTemplates";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

const SchemaEditor = lazy(() => import("../SchemaEditor/SchemaEditor"));
const MockServerPanel = lazy(() => import("../MockServer/MockServerPanel"));
const DocGenerator = lazy(() => import("../Docs/DocGenerator"));
import ImportExport from "../ImportExport/ImportExport";
import WorkspaceManager from "../Workspaces/WorkspaceManager";
import RequestChainBuilder from "../RequestChaining/RequestChainBuilder";
import TemplateLibrary from "../Templates/TemplateLibrary";
import Button from "../UI/Button";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";

interface LeftPanelProps {
  view: "collections" | "history" | "templates" | "environments" | "schema" | "mock" | "docs" | "workspaces" | "chains" | null;
  isOpen: boolean;
  onClose: () => void;
  onNewRequest: () => void;
}

export default function LeftPanel({ view, isOpen, onClose, onNewRequest }: LeftPanelProps) {
  // Keyboard shortcut: Esc to close
  useKeyboardShortcuts([
    {
      key: "Escape",
      handler: () => {
        if (isOpen) {
          onClose();
        }
      },
      description: "Close panel",
    },
  ]);

  if (!isOpen || !view) return null;

  const getTitle = () => {
    switch (view) {
      case "collections":
        return "Collections";
      case "history":
        return "Request History";
      case "templates":
        return "Templates";
      case "environments":
        return "Environments";
      case "schema":
        return "Schema Editor";
      case "mock":
        return "Mock Server";
      case "docs":
        return "Documentation";
      case "workspaces":
        return "Workspaces";
      case "chains":
        return "Request Chains";
      default:
        return "";
    }
  };

  const renderContent = () => {
    switch (view) {
      case "collections":
        return (
          <div className="p-4 space-y-4">
            <CollectionManager />
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <ImportExport />
            </div>
          </div>
        );
      case "history":
        return <RequestHistory />;
      case "templates":
        return (
          <div className="p-4">
            <TemplateLibrary />
          </div>
        );
      case "environments":
        return (
          <div className="p-4">
            <EnvironmentManager />
          </div>
        );
      case "schema":
        return (
          <Suspense fallback={<div className="p-4 text-center"><Loader2 className="animate-spin mx-auto" /></div>}>
            <SchemaEditor onSchemaSelect={() => {}} />
          </Suspense>
        );
      case "mock":
        return (
          <Suspense fallback={<div className="p-4 text-center"><Loader2 className="animate-spin mx-auto" /></div>}>
            <MockServerPanel />
          </Suspense>
        );
      case "docs":
        return (
          <Suspense fallback={<div className="p-4 text-center"><Loader2 className="animate-spin mx-auto" /></div>}>
            <DocGenerator />
          </Suspense>
        );
      case "workspaces":
        return (
          <div className="p-4">
            <WorkspaceManager />
          </div>
        );
      case "chains":
        return (
          <div className="p-4">
            <RequestChainBuilder />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {/* Mobile overlay/backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      
      {/* Panel */}
      <div className={`
        fixed md:relative inset-y-0 left-0 z-50 md:z-auto
        w-full md:w-full
        bg-white dark:bg-gray-800 
        border-r border-gray-200 dark:border-gray-700 
        flex flex-col h-full 
        shadow-xl md:shadow-xl
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-blue-600 rounded-full" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {getTitle()}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            title="Đóng panel (Esc)"
            className="hover:bg-gray-200 dark:hover:bg-gray-700"
            aria-label="Close panel"
          >
            <X size={18} />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
          {renderContent()}
        </div>
      </div>
    </>
  );
}

