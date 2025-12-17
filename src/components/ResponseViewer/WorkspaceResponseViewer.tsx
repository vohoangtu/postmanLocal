/**
 * Workspace Response Viewer Component
 * Wrapper component cho workspace context với collaboration features
 * Bao gồm: annotations trên response body, comments trên response
 */

import { useState } from 'react';
import BaseResponseViewer from './BaseResponseViewer';
import TabButton from '../UI/TabButton';
import { MessageSquare, StickyNote } from 'lucide-react';
import CommentsPanel from '../Comments/CommentsPanel';
import AnnotationEditor from '../Annotations/AnnotationEditor';
import ComponentErrorBoundary from '../Error/ComponentErrorBoundary';
import { usePanelStore } from '../../stores/panelStore';

export interface WorkspaceResponseViewerProps {
  response: any;
  responseTime?: number;
  requestId?: string | null; // Request ID để hiển thị annotations
  collectionId?: string | null; // Collection ID để hiển thị comments
}

export default function WorkspaceResponseViewer({ 
  response, 
  responseTime,
  requestId,
  collectionId
}: WorkspaceResponseViewerProps) {
  const { activeCollaborationTab, setActiveCollaborationTab } = usePanelStore();

  // Render collaboration panel với các tabs
  const renderCollaborationPanel = () => {
    if (!requestId && !collectionId) return null;

    return (
      <ComponentErrorBoundary componentName="Response Collaboration Panel">
        <div className="bg-gray-50 dark:bg-gray-900/30">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {collectionId && (
              <TabButton
                active={activeCollaborationTab === "comments"}
                onClick={() => setActiveCollaborationTab(activeCollaborationTab === "comments" ? null : "comments")}
                icon={MessageSquare}
              >
                Comments
              </TabButton>
            )}
            {requestId && (
              <TabButton
                active={activeCollaborationTab === "annotations"}
                onClick={() => setActiveCollaborationTab(activeCollaborationTab === "annotations" ? null : "annotations")}
                icon={StickyNote}
              >
                Annotations
              </TabButton>
            )}
          </div>
          {activeCollaborationTab === "comments" && collectionId && (
            <div className="p-4 max-h-64 overflow-y-auto">
              <ComponentErrorBoundary componentName="Comments Panel">
                <CommentsPanel collectionId={collectionId} />
              </ComponentErrorBoundary>
            </div>
          )}
          {activeCollaborationTab === "annotations" && requestId && (
            <div className="p-4 max-h-64 overflow-y-auto">
              <ComponentErrorBoundary componentName="Annotations Panel">
                <AnnotationEditor requestId={requestId} />
              </ComponentErrorBoundary>
            </div>
          )}
        </div>
      </ComponentErrorBoundary>
    );
  };

  return (
    <BaseResponseViewer
      response={response}
      responseTime={responseTime}
      enableCollaboration={true}
      renderCollaborationPanel={renderCollaborationPanel}
      requestId={requestId}
    />
  );
}
