/**
 * Workspace Request Builder Component
 * Wrapper component cho workspace context với collaboration features
 * Bao gồm: comments, annotations, reviews, shared editing, conflict resolution
 */

import { useEffect, useState } from 'react';
import BaseRequestBuilder, { BaseRequestBuilderProps } from './BaseRequestBuilder';
import TabButton from '../UI/TabButton';
import { MessageSquare, StickyNote, CheckCircle2 } from 'lucide-react';
import CommentsPanel from '../Comments/CommentsPanel';
import AnnotationEditor from '../Annotations/AnnotationEditor';
import RequestReviewPanel from './RequestReviewPanel';
import ConflictResolver from './ConflictResolver';
import SharedEditingIndicator from '../Workspaces/SharedEditingIndicator';
import ComponentErrorBoundary from '../Error/ComponentErrorBoundary';
import { usePanelStore } from '../../stores/panelStore';
import { useCollectionStore } from '../../stores/collectionStore';
import { useAuth } from '../../contexts/AuthContext';
import { websocketService } from '../../services/websocketService';

export interface WorkspaceRequestBuilderProps {
  requestId: string | null;
  onResponse: (response: any) => void;
  tabId?: string;
  onSaveSuccess?: () => void;
}

export default function WorkspaceRequestBuilder({ 
  onResponse, 
  tabId, 
  onSaveSuccess 
}: WorkspaceRequestBuilderProps) {
  const { activeCollaborationTab, setActiveCollaborationTab } = usePanelStore();
  const { collections } = useCollectionStore();
  const { user } = useAuth();
  const [savedRequestId, setSavedRequestId] = useState<string | null>(null);
  const [savedCollectionId, setSavedCollectionId] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [isLocked, setIsLocked] = useState(false);

  // Callback khi request được save
  const handleRequestSaved = (requestId: string, collectionId: string) => {
    setSavedRequestId(requestId);
    setSavedCollectionId(collectionId);
  };

  // Listen for request updates và conflicts từ websocket
  useEffect(() => {
    if (!savedRequestId || !savedCollectionId || !user) return;

    const collection = collections.find((c) => c.id === savedCollectionId);
    const workspaceId = collection?.workspace_id;

    if (!workspaceId) return;

    const unsubscribe = websocketService.subscribe(
      `private-workspace.${workspaceId}`,
      'request.updated',
      (data: any) => {
        // Check if this is an update to our current request
        if (data.request_id === savedRequestId && data.user_id !== user?.id) {
          // Detect conflicts
          const currentRequest = collection?.requests?.find((r: any) => r.id === savedRequestId);
          if (currentRequest && data.changes) {
            const detectedConflicts: any[] = [];
            
            // Check for conflicts in different fields
            Object.entries(data.changes).forEach(([field, incomingValue]: [string, any]) => {
              const currentValue = currentRequest[field];
              if (currentValue !== incomingValue) {
                detectedConflicts.push({
                  field,
                  currentValue: currentValue || '',
                  incomingValue: incomingValue || '',
                  timestamp: data.timestamp,
                  user: data.user,
                });
              }
            });

            if (detectedConflicts.length > 0) {
              setConflicts(detectedConflicts);
              setIsLocked(true);
            }
          }
        }
      }
    );

    return unsubscribe;
  }, [savedRequestId, savedCollectionId, collections, user]);

  // Render collaboration panel với các tabs
  const renderCollaborationPanel = (requestId: string | null, collectionId: string | null) => {
    if (!requestId && !collectionId) return null;

    return (
      <>
        {/* Shared Editing Indicator */}
        {requestId && collectionId && (
          <div className="px-4 pt-4">
            <SharedEditingIndicator
              entityType="request"
              entityId={requestId}
              entityName="Request"}
            />
          </div>
        )}

        {/* Conflict Resolver */}
        {conflicts.length > 0 && (
          <div className="px-4 pt-4">
            <ConflictResolver
              conflicts={conflicts}
              onResolve={(resolutions) => {
                // Resolutions sẽ được xử lý bởi parent component nếu cần
                setConflicts([]);
                setIsLocked(false);
              }}
              onCancel={() => {
                setConflicts([]);
                setIsLocked(false);
              }}
            />
          </div>
        )}

        {/* Collaboration Tabs - Comments & Annotations */}
        <ComponentErrorBoundary componentName="Collaboration Panel">
          <div className="border-t border-gray-200 dark:border-gray-700 mt-4 bg-gray-50 dark:bg-gray-900/30">
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <TabButton
                active={activeCollaborationTab === "comments"}
                onClick={() => setActiveCollaborationTab(activeCollaborationTab === "comments" ? null : "comments")}
                icon={MessageSquare}
              >
                Comments
              </TabButton>
              {requestId && (
                <TabButton
                  active={activeCollaborationTab === "annotations"}
                  onClick={() => setActiveCollaborationTab(activeCollaborationTab === "annotations" ? null : "annotations")}
                  icon={StickyNote}
                >
                  Annotations
                </TabButton>
              )}
              {requestId && collectionId && collections.find((c) => c.id === collectionId)?.workspace_id && (
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
            {activeCollaborationTab === "annotations" && requestId && (
              <div className="p-4 max-h-64 overflow-y-auto">
                <ComponentErrorBoundary componentName="Annotations Panel">
                  <AnnotationEditor requestId={requestId} />
                </ComponentErrorBoundary>
              </div>
            )}
            {activeCollaborationTab === "reviews" && requestId && collectionId && (
              <div className="p-4 max-h-64 overflow-y-auto">
                <ComponentErrorBoundary componentName="Review Panel">
                  <RequestReviewPanel
                    requestId={requestId}
                    collectionId={collectionId}
                    workspaceId={collections.find((c) => c.id === collectionId)?.workspace_id}
                  />
                </ComponentErrorBoundary>
              </div>
            )}
          </div>
        </ComponentErrorBoundary>
      </>
    );
  };

  return (
    <BaseRequestBuilder
      requestId={null}
      onResponse={onResponse}
      tabId={tabId}
      onSaveSuccess={onSaveSuccess}
      enableCollaboration={true}
      renderCollaborationPanel={renderCollaborationPanel}
      onRequestSaved={handleRequestSaved}
      externalSavedRequestId={savedRequestId}
      externalSavedCollectionId={savedCollectionId}
    />
  );
}
