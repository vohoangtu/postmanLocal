/**
 * CollectionDocumentation Component (Backward Compatibility)
 * Re-export PublicCollectionDocumentation để giữ backward compatibility
 * Sử dụng PublicCollectionDocumentation cho public usage, WorkspaceCollectionDocumentation cho workspace context
 */

import PublicCollectionDocumentation from './PublicCollectionDocumentation';

interface CollectionDocumentationProps {
  collectionId: string;
}

export default function CollectionDocumentation({ collectionId }: CollectionDocumentationProps) {
  return (
    <PublicCollectionDocumentation
      collectionId={collectionId}
    />
  );
}
