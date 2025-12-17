/**
 * Workspace Left Panel Component
 * Wrapper component cho workspace context với workspace-specific views
 * Có thể filter collections theo workspace, hiển thị workspace-specific templates, etc.
 */

import { memo, useCallback } from 'react';
import BaseLeftPanel from './BaseLeftPanel';
import WorkspaceCollectionManager from '../Collections/WorkspaceCollectionManager';
import EnvironmentManager from '../Environment/EnvironmentManager';
import RequestHistory from '../RequestHistory/RequestHistory';
import TemplateLibrary from '../Templates/TemplateLibrary';
import RequestChainBuilder from '../RequestChaining/RequestChainBuilder';
import FeatureGate from '../FeatureGate/FeatureGate';
import { useParams } from 'react-router-dom';

interface WorkspaceLeftPanelProps {
  view: "collections" | "history" | "templates" | "environments" | "schema" | "mock" | "docs" | "workspaces" | "chains" | null;
  isOpen: boolean;
  onClose: () => void;
  onNewRequest: () => void;
}

function WorkspaceLeftPanel({ 
  view, 
  isOpen, 
  onClose, 
  onNewRequest 
}: WorkspaceLeftPanelProps) {
  const { id: workspaceId } = useParams<{ id: string }>();

  const renderContentView = useCallback((viewName: string) => {
    switch (viewName) {
      case "collections":
        return (
          <FeatureGate feature="collections">
            <div className="p-4 space-y-4">
              <WorkspaceCollectionManager workspaceId={workspaceId || null} />
            </div>
          </FeatureGate>
        );
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
      case "chains":
        return (
          <FeatureGate feature="request_chaining">
            <div className="p-4">
              <RequestChainBuilder />
            </div>
          </FeatureGate>
        );
      default:
        return null;
    }
  }, [workspaceId]);

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

export default memo(WorkspaceLeftPanel);
