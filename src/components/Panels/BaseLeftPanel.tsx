/**
 * Base Left Panel Component
 * Component cơ bản chứa tất cả logic chung cho left panel
 * Được sử dụng bởi cả PublicLeftPanel và WorkspaceLeftPanel
 */

import { useState, useEffect, memo, useMemo, useCallback } from "react";
import { X } from "lucide-react";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import Button from "../UI/Button";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";
import FeatureGate from "../FeatureGate/FeatureGate";
import { layoutStyles } from "../../utils/layoutStyles";
import { cn } from "../../utils/cn";

const SchemaEditor = lazy(() => import("../SchemaEditor/SchemaEditor"));
const MockServerPanel = lazy(() => import("../MockServer/MockServerPanel"));
const DocGenerator = lazy(() => import("../Docs/DocGenerator"));

export interface BaseLeftPanelProps {
  view: "collections" | "history" | "templates" | "environments" | "schema" | "mock" | "docs" | "workspaces" | "chains" | null;
  isOpen: boolean;
  onClose: () => void;
  onNewRequest: () => void;
  // Props để customize behavior
  renderContentView?: (view: string) => React.ReactNode; // Custom content renderer
  availableViews?: string[]; // Available views cho panel này
}

function BaseLeftPanel({ 
  view, 
  isOpen, 
  onClose, 
  onNewRequest,
  renderContentView,
  availableViews
}: BaseLeftPanelProps) {
  // Keyboard shortcut: Esc to close
  const handleEscape = useCallback(() => {
    if (isOpen) {
      onClose();
    }
  }, [isOpen, onClose]);

  useKeyboardShortcuts([
    {
      key: "Escape",
      handler: handleEscape,
      description: "Close panel",
    },
  ]);

  if (!isOpen || !view) return null;

  const title = useMemo(() => {
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
  }, [view]);

  // Default content renderer
  const defaultRenderContent = useCallback(() => {
    switch (view) {
      case "collections":
        return (
          <FeatureGate feature="collections">
            <div className="p-4 space-y-4">
              {/* CollectionManager sẽ được inject từ wrapper */}
            </div>
          </FeatureGate>
        );
      case "history":
        return null; // RequestHistory sẽ được inject
      case "templates":
        return (
          <FeatureGate feature="templates">
            <div className="p-4">
              {/* TemplateLibrary sẽ được inject */}
            </div>
          </FeatureGate>
        );
      case "environments":
        return (
          <FeatureGate feature="environments">
            <div className="p-4">
              {/* EnvironmentManager sẽ được inject */}
            </div>
          </FeatureGate>
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
            <FeatureGate feature="mock_server">
              <MockServerPanel />
            </FeatureGate>
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
            {/* WorkspaceManager sẽ được inject */}
          </div>
        );
      case "chains":
        return (
          <FeatureGate feature="request_chaining">
            <div className="p-4">
              {/* RequestChainBuilder sẽ được inject */}
            </div>
          </FeatureGate>
        );
      default:
        return null;
    }
  }, [view]);

  const content = useMemo(() => {
    if (renderContentView) {
      return renderContentView(view || "");
    }
    return defaultRenderContent();
  }, [renderContentView, view, defaultRenderContent]);

  return (
    <>
      {/* Mobile overlay/backdrop */}
      {isOpen && (
        <div
          className={cn(layoutStyles.mobileOverlay)}
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      
      {/* Panel */}
      <div className={cn(
        'fixed md:relative inset-y-0 left-0 z-50 md:z-auto',
        layoutStyles.panelContainer,
        'bg-white dark:bg-gray-800',
        'border-r border-gray-300 dark:border-gray-700',
        'flex flex-col h-full',
        'shadow-lg md:shadow-md',
        'transform transition-transform duration-300 ease-in-out',
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-7 bg-gradient-to-b from-blue-600 to-blue-500 rounded-full shadow-sm" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            title="Đóng panel (Esc)"
            className="hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
            aria-label="Close panel"
          >
            <X size={18} />
          </Button>
        </div>

        {/* Content */}
        <div className={cn(
          'flex-1 overflow-y-auto',
          'scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600',
          'bg-gray-50 dark:bg-gray-900/30'
        )}>
          {content}
        </div>
      </div>
    </>
  );
}

export default memo(BaseLeftPanel);
