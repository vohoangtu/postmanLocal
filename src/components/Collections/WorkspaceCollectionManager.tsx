/**
 * Workspace Collection Manager Component
 * Wrapper component cho workspace context với collaboration features
 * Bao gồm: LiveCollaborators, CommentsPanel, VersionHistory, permissions
 */

import BaseCollectionManager from './BaseCollectionManager';
import LiveCollaborators from '../Workspaces/LiveCollaborators';
import { useCollectionStore } from '../../stores/collectionStore';

interface WorkspaceCollectionManagerProps {
  workspaceId?: string | null; // Filter collections theo workspace
}

export default function WorkspaceCollectionManager({ 
  workspaceId 
}: WorkspaceCollectionManagerProps) {
  const { collections } = useCollectionStore();

  // Render collaboration features cho mỗi collection (LiveCollaborators indicator)
  const renderCollaborationFeatures = (collectionId: string) => {
    const collection = collections.find((c) => c.id === collectionId);
    if (!collection) return null;

    return (
      <>
        {collection.workspace_id && (
          <LiveCollaborators
            entityType="collection"
            entityId={collectionId}
            entityName={collection.name}
          />
        )}
      </>
    );
  };

  return (
    <BaseCollectionManager
      enableCollaboration={true}
      renderCollaborationFeatures={renderCollaborationFeatures}
      showWorkspaceSelector={false}
      filterByWorkspace={workspaceId}
    />
  );
}
