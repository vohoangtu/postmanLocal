/**
 * Workspace Collection Documentation Component
 * Wrapper component cho workspace context với collaboration features
 * Bao gồm: collaborative editing, comments, version history, approval workflow
 */

import { useState } from 'react';
import BaseCollectionDocumentation from './BaseCollectionDocumentation';
import TabButton from '../UI/TabButton';
import { MessageSquare, History, CheckCircle2 } from 'lucide-react';
import CommentsPanel from '../Comments/CommentsPanel';
import VersionHistory from './VersionHistory';
import ComponentErrorBoundary from '../Error/ComponentErrorBoundary';
import { usePanelStore } from '../../stores/panelStore';

export interface WorkspaceCollectionDocumentationProps {
  collectionId: string;
}

export default function WorkspaceCollectionDocumentation({ 
  collectionId 
}: WorkspaceCollectionDocumentationProps) {
  const { activeCollaborationTab, setActiveCollaborationTab } = usePanelStore();
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  // Handle documentation change với version tracking
  const handleDocumentationChange = (content: string) => {
    // Có thể lưu version history ở đây
    console.log('Documentation changed:', content);
  };

  // Render collaboration panel với các tabs
  const renderCollaborationPanel = () => {
    return (
      <ComponentErrorBoundary componentName="Documentation Collaboration Panel">
        <div className="bg-gray-50 dark:bg-gray-900/30">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <TabButton
              active={activeCollaborationTab === "comments"}
              onClick={() => setActiveCollaborationTab(activeCollaborationTab === "comments" ? null : "comments")}
              icon={MessageSquare}
            >
              Comments
            </TabButton>
            <TabButton
              active={activeCollaborationTab === "versions"}
              onClick={() => {
                setActiveCollaborationTab(activeCollaborationTab === "versions" ? null : "versions");
                setShowVersionHistory(!showVersionHistory);
              }}
              icon={History}
            >
              Versions
            </TabButton>
            <TabButton
              active={activeCollaborationTab === "reviews"}
              onClick={() => setActiveCollaborationTab(activeCollaborationTab === "reviews" ? null : "reviews")}
              icon={CheckCircle2}
            >
              Reviews
            </TabButton>
          </div>
          {activeCollaborationTab === "comments" && (
            <div className="p-4 max-h-64 overflow-y-auto">
              <ComponentErrorBoundary componentName="Comments Panel">
                <CommentsPanel collectionId={collectionId} />
              </ComponentErrorBoundary>
            </div>
          )}
          {activeCollaborationTab === "versions" && showVersionHistory && (
            <div className="p-4 max-h-64 overflow-y-auto">
              <ComponentErrorBoundary componentName="Version History Panel">
                <VersionHistory
                  collectionId={collectionId}
                  onClose={() => setShowVersionHistory(false)}
                />
              </ComponentErrorBoundary>
            </div>
          )}
          {activeCollaborationTab === "reviews" && (
            <div className="p-4 max-h-64 overflow-y-auto">
              <ComponentErrorBoundary componentName="Documentation Reviews Panel">
                {/* Documentation reviews sẽ được implement sau */}
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Documentation reviews feature coming soon
                </div>
              </ComponentErrorBoundary>
            </div>
          )}
        </div>
      </ComponentErrorBoundary>
    );
  };

  return (
    <BaseCollectionDocumentation
      collectionId={collectionId}
      enableCollaboration={true}
      renderCollaborationPanel={renderCollaborationPanel}
      enableEditing={true}
      onDocumentationChange={handleDocumentationChange}
    />
  );
}
