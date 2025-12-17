/**
 * Workspace Test Editor Component
 * Wrapper component cho workspace context với collaboration features
 * Bao gồm: test reviews/approvals, comments trên test scripts
 */

import { useState } from 'react';
import BaseTestEditor, { TestResult } from './BaseTestEditor';
import TabButton from '../UI/TabButton';
import { MessageSquare, CheckCircle2 } from 'lucide-react';
import CommentsPanel from '../Comments/CommentsPanel';
import ComponentErrorBoundary from '../Error/ComponentErrorBoundary';
import { usePanelStore } from '../../stores/panelStore';

export interface WorkspaceTestEditorProps {
  response: any;
  onTestResults: (results: TestResult[]) => void;
  testId?: string | null; // Test ID để hiển thị reviews/comments
  collectionId?: string | null; // Collection ID để hiển thị comments
}

export default function WorkspaceTestEditor({ 
  response, 
  onTestResults,
  testId,
  collectionId
}: WorkspaceTestEditorProps) {
  const { activeCollaborationTab, setActiveCollaborationTab } = usePanelStore();

  // Render collaboration panel với các tabs
  const renderCollaborationPanel = () => {
    if (!testId && !collectionId) return null;

    return (
      <ComponentErrorBoundary componentName="Test Collaboration Panel">
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
            {testId && (
              <TabButton
                active={activeCollaborationTab === "reviews"}
                onClick={() => setActiveCollaborationTab(activeCollaborationTab === "reviews" ? null : "reviews")}
                icon={CheckCircle2}
              >
                Reviews
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
          {activeCollaborationTab === "reviews" && testId && (
            <div className="p-4 max-h-64 overflow-y-auto">
              <ComponentErrorBoundary componentName="Test Reviews Panel">
                {/* Test reviews sẽ được implement sau */}
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Test reviews feature coming soon
                </div>
              </ComponentErrorBoundary>
            </div>
          )}
        </div>
      </ComponentErrorBoundary>
    );
  };

  return (
    <BaseTestEditor
      response={response}
      onTestResults={onTestResults}
      enableCollaboration={true}
      renderCollaborationPanel={renderCollaborationPanel}
      testId={testId}
    />
  );
}
