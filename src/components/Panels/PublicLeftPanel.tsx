/**
 * Public Left Panel Component
 * Wrapper component đơn giản cho public usage (MainApp)
 * Hiển thị các view: collections, history, templates, environments, schema, mock, docs, workspaces, chains
 */

import { memo, useCallback } from 'react';
import BaseLeftPanel from './BaseLeftPanel';
import PublicCollectionManager from '../Collections/PublicCollectionManager';
import EnvironmentManager from '../Environment/EnvironmentManager';
import RequestHistory from '../RequestHistory/RequestHistory';
import TemplateLibrary from '../Templates/TemplateLibrary';
import WorkspaceManager from '../Workspaces/WorkspaceManager';
import RequestChainBuilder from '../RequestChaining/RequestChainBuilder';
import ImportExport from '../ImportExport/ImportExport';
import FeatureGate from '../FeatureGate/FeatureGate';

interface PublicLeftPanelProps {
  view: "collections" | "history" | "templates" | "environments" | "schema" | "mock" | "docs" | "workspaces" | "chains" | null;
  isOpen: boolean;
  onClose: () => void;
  onNewRequest: () => void;
}

function PublicLeftPanel({ 
  view, 
  isOpen, 
  onClose, 
  onNewRequest 
}: PublicLeftPanelProps) {
  const renderContentView = useCallback((viewName: string) => {
    // LeftPanel chỉ hiển thị các tools nhỏ: History, Templates, Environments
    // Collections, Chains, Mock Server sẽ hiển thị trong main content
    switch (viewName) {
      case "history":
        return <RequestHistory />;
      case "templates":
        return (
          <FeatureGate feature="templates">
            <div className="p-4">
              <TemplateLibrary />
            </div>
          </FeatureGate>
        );
      case "environments":
        return (
          <FeatureGate feature="environments">
            <div className="p-4">
              <EnvironmentManager />
            </div>
          </FeatureGate>
        );
      // Các chức năng chính không hiển thị trong LeftPanel nữa
      case "collections":
      case "chains":
      case "mock":
        // Những view này sẽ được hiển thị trong main content thông qua MainContentView
        return null;
      case "workspaces":
        return (
          <div className="p-4">
            <WorkspaceManager />
          </div>
        );
      default:
        return null;
    }
  }, []);

  return (
    <BaseLeftPanel
      view={view}
      isOpen={isOpen}
      onClose={onClose}
      onNewRequest={onNewRequest}
      renderContentView={renderContentView}
    />
  );
}

export default memo(PublicLeftPanel);
